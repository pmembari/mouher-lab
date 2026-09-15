from django.urls import include, path


urlpatterns = [
    path("api/commerce/", include("commerce.urls")),
]
