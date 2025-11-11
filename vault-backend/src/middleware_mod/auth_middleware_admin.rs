use actix_web::{
    dev::{ServiceRequest, ServiceResponse, Transform, Service, forward_ready},
    Error, HttpResponse, HttpMessage,
    body::EitherBody,
};
use futures_util::future::{LocalBoxFuture, Ready, ready};
use std::rc::Rc;
use crate::auth_admin::verify_jwt_admin;
use crate::models::ErrorResponse;

pub struct AuthMiddlewareAdmin;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddlewareAdmin
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = AuthMiddlewareServiceAdmin<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareServiceAdmin {
            service: Rc::new(service),
        }))
    }
}

pub struct AuthMiddlewareServiceAdmin<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareServiceAdmin<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = Rc::clone(&self.service);

        Box::pin(async move {
            // Extract token from Authorization header
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|h| h.to_str().ok());

            let token = match auth_header {
                Some(header) if header.starts_with("Bearer ") => {
                    &header[7..]
                }
                _ => {
                    let (request, _) = req.into_parts();
                    let response = HttpResponse::Unauthorized()
                        .json(ErrorResponse {
                            error: "Missing or invalid Authorization header".to_string(),
                        })
                        .map_into_right_body();
                    
                    return Ok(ServiceResponse::new(request, response));
                }
            };

            // Verify JWT token
            match verify_jwt_admin(token) {
                Ok(claims) => {
                    // Store claims in request extensions for later use
                    req.extensions_mut().insert(claims);
                    
                    // Call the next service
                    let res = service.call(req).await?;
                    Ok(res.map_into_left_body())
                }
                Err(_) => {
                    let (request, _) = req.into_parts();
                    let response = HttpResponse::Unauthorized()
                        .json(ErrorResponse {
                            error: "Invalid or expired token".to_string(),
                        })
                        .map_into_right_body();
                    
                    Ok(ServiceResponse::new(request, response))
                }
            }
        })
    }
}