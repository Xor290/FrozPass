use actix_web::{
    dev::{ServiceRequest, ServiceResponse, Transform, Service, forward_ready},
    Error, HttpResponse, HttpMessage,
    body::EitherBody,
};
use futures_util::future::{LocalBoxFuture, Ready, ready};
use std::rc::Rc;
use crate::auth::{extract_token_from_header, verify_jwt};
use crate::models::ErrorResponse;

pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = AuthMiddlewareMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareMiddleware {
            service: Rc::new(service),
        }))
    }
}

pub struct AuthMiddlewareMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let srv = Rc::clone(&self.service);

        Box::pin(async move {
            match extract_token_from_header(req.request()) {
                Ok(token) => match verify_jwt(&token) {
                    Ok(claims) => {
                        req.extensions_mut().insert(claims);
                        match srv.call(req).await {
                            Ok(res) => Ok(res.map_into_left_body()),
                            Err(e) => Err(e),
                        }
                    }
                    Err(_) => {
                        let resp = HttpResponse::Unauthorized().json(ErrorResponse {
                            error: "Invalid or expired token".into(),
                        });
                        Ok(req.into_response(resp).map_into_right_body())
                    }
                },
                Err(resp) => {
                    Ok(req.into_response(resp).map_into_right_body())
                }
            }
        })
    }
}