---
title: Kubernetes
---

The kubernetes integration will automatically deploy outposts on any Kubernetes Cluster.

This integration has the advantage over manual deployments of automatic updates (whenever authentik is updated, it updates the outposts), and authentik can (in a future version) automatically rotate the token that the outpost uses to communicate with the core authentik server.

This integration creates the following objects:

- Deployment for the outpost container
- Service
- Secret to store the token
- Prometheus ServiceMonitor (if the Prometheus Operator is installed in the target cluster)
- Ingress (only Proxy outposts)
- HTTPRoute (only Proxy outposts, when the Gateway API resources are installed in the target cluster, and the `kubernetes_httproute_parent_refs` setting is set, see below)
- Traefik Middleware (only Proxy outposts with forward auth enabled)

The following outpost settings are used:

- `object_naming_template`: Configures how the container is called
- `container_image`: Optionally overwrites the standard container image (see [Configuration](../../../install-config/configuration/configuration.mdx) to configure the global default)
- `kubernetes_replicas`: Replica count for the deployment of the outpost
- `kubernetes_namespace`: Namespace to deploy in, defaults to the same namespace authentik is deployed in (if available)
- `kubernetes_ingress_annotations`: Any additional annotations to add to the ingress object, for example cert-manager
- `kubernetes_ingress_secret_name`: Name of the secret that is used for TLS connections, can be empty to disable TLS config
- `kubernetes_ingress_class_name`: Optionally set the ingress class used for the generated ingress, requires authentik 2022.11.0
- `kubernetes_httproute_parent_refs`: Define which Gateways the HTTPRoute wants to be attached to.
- `kubernetes_httproute_annotations`: Any additional annotations to add to the HTTPRoute object
- `kubernetes_service_type`: Service kind created, can be set to LoadBalancer for LDAP outposts for example
- `kubernetes_disabled_components`: Disable any components of the kubernetes integration, can be any of
    - 'secret'
    - 'deployment'
    - 'service'
    - 'prometheus servicemonitor'
    - 'ingress'
    - 'traefik middleware'
    - 'httproute'
- `kubernetes_image_pull_secrets`: If the above docker image is in a private repository, use these secrets to pull. (NOTE: The secret must be created manually in the namespace first.)
- `kubernetes_json_patches`: Applies an RFC 6902 compliant JSON patch to the Kubernetes objects.

## Permissions

The permissions required for this integration are documented in the helm chart. See [Cluster-level](https://github.com/goauthentik/helm/blob/main/charts/authentik-remote-cluster/templates/clusterrolebinding.yaml) and [Namespace-level](https://github.com/goauthentik/helm/blob/main/charts/authentik-remote-cluster/templates/rolebinding.yaml).

## Remote clusters

To add a remote cluster, you can simply install this helm chart in the target cluster and namespace: https://artifacthub.io/packages/helm/goauthentik/authentik-remote-cluster

After installation, the helm chart outputs an example kubeconfig file, that you can enter in authentik to connect to the cluster.
