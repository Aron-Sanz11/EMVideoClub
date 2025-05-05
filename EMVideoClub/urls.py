from django.urls import path
from . import views

urlpatterns = [
    path('', views.inicio, name='inicio'),
    path('peliculas/', views.catalogo_peliculas, name='peliculas'),
    path('prestamos/', views.prestamos, name='prestamos'),
    path('apartados/', views.apartados, name='apartados'),
    path('adminPeliculas/', views.adminPeliculas, name='adminPeliculas'),

    path('socios/', views.socios, name="socios"),

    path('peliculas/iniciarPrestamo/', views.iniciarPrestamo, name='iniciarPrestamo'),
    path('peliculas/guardarApartado/', views.guardarApartado, name='guardarApartado'),
    path('peliculas/guardarPrestamo/', views.guardarPrestamo, name='guardarPrestamo'),
    
    
    path('prestamos/iniciarDevolucion/', views.iniciarDevolucion, name='iniciarDevolucion'),
    path('prestamos/devolverPrestamo/', views.devolverPrestamo, name='devolverPrestamo'),

    path('apartados/continuarPrestamo/', views.continuarPrestamo, name='continuarPrestamo'),

    path('socios/detallesSocios/', views.detallesSocios, name='detallesSocios'),
    path('socios/guardarDetallesSocio/', views.guardarDetallesSocio, name='guardarDetallesSocio'),
    path('socios/nuevoSocio/', views.nuevoSocio, name='nuevoSocio'),

    path('adminPeliculas/detallesPelicula', views.detallesPelicula, name='detallesPelicula'),
    path('adminPeliculas/guardarDetallesPelicula', views.guardarDetallesPelicula, name='guardarDetallesPelicula'),
    path('adminPeliculas/darBajaAltaPeliculaCopia', views.darBajaAltaPeliculaCopia, name='darBajaAltaPeliculaCopia'),
    path('adminPeliculas/detallesPrestamo', views.detallesPrestamo, name='detallesPrestamo'),
    path('adminPeliculas/agregarPelicula', views.agregarPelicula, name='agregarPelicula'),
    path('adminPeliculas/agregarCopias', views.agregarCopias, name='agregarCopias'),
]