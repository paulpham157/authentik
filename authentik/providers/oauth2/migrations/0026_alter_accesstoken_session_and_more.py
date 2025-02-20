# Generated by Django 5.0.10 on 2024-12-12 17:16

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentik_core", "0040_provider_invalidation_flow"),
        (
            "authentik_providers_oauth2",
            "0025_rename_jwks_sources_oauth2provider_jwt_federation_sources_and_more",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="accesstoken",
            name="session",
            field=models.ForeignKey(
                default=None,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="authentik_core.authenticatedsession",
            ),
        ),
        migrations.AlterField(
            model_name="authorizationcode",
            name="session",
            field=models.ForeignKey(
                default=None,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="authentik_core.authenticatedsession",
            ),
        ),
    ]
