# FrozPass

```bash
docker pull xor1234/vault-frontend
docker pull xor1234/vault-backend
```

## Installation avec helm
```bash
helm install frozpass ./vault-helm --values ./vault-helm/values.yaml
```

## test 
```bash
kubectl get all -n vault
kubectl get ingress -n vault
```

```bash
echo "127.0.0.1 vault.local" | sudo tee -a /etc/hosts
```

## Pour activer le tls

```yaml
    tls:
      enabled: false #mettre ceci à true
      secretName: vault-tls
```

## En cas de monter de version 

```bash
helm upgrade frozpass ./vault-helm --values ./vault-helm/values.yaml
```
