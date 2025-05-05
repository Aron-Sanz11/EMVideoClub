from django.shortcuts import render
from django.forms.models import model_to_dict
from .models import RelPeliculasgeneros, CatPeliculas, RelPeliculascopias, CatPersonas, CatRoles, RelRolespersonas, ProSolicitdesapartados, CatEstatus, ProSolicitudesprestamos, CatGeneros, RelPersonasgenerosfavoritos, RelPersonasactoresfavoritos, RelPersonasdirectoresfavoritos, RelPeliculaspersonas
from django.db.models import Count, Q
from django.db.models import Prefetch

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
from datetime import datetime
import json

# Create your views here.

def inicio(request):
    return render(request, 'EMVideoClub/inicio.html')

def catalogo_peliculas(request):
    peliculas = CatPeliculas.objects.all()
    catalogo = []

    for pelicula in peliculas:
        generos = pelicula.generos.all()
        relaciones = pelicula.relpeliculaspersonas_set.select_related('icodpersona')
        copiasDisponobles = pelicula.relpeliculascopias_set.filter(icodestatus__icodestatus=1).count()
        
        elenco = []
        for relacion in relaciones:
            persona = relacion.icodpersona
            roles = persona.relrolespersonas_set.select_related('icodrol').all()
            roles_texto = ', '.join([r.icodrol.tnombre for r in roles])
            elenco.append(f"{roles_texto}: {persona.tnombre}")

        catalogo.append({
            'iCodPelicula': pelicula.icodpelicula,
            'nombre': pelicula.tnombre,
            'fechaestreno': pelicula.dfechaestreno,
            'generos': [g.tnombre for g in generos],
            'elenco': elenco,
            'copiasDisponibles': copiasDisponobles,  # <- Aquí lo agregamos
            'estatusDisponibilidad': 'success' if copiasDisponobles > 0 else 'danger',
            'iconosAccion': 'Copias Disponibles' if copiasDisponobles > 0 else 'No Disponible'
        })

    return render(request, 'EMVideoClub/peliculas.html', {'catalogo': catalogo})

##Detalles de la pelicula
@require_POST
@csrf_protect

def iniciarPrestamo(request):
    iCodPelicula = request.POST.get('iCodPelicula')
    socios = CatPersonas.objects.filter(
        relrolespersonas__icodrol__icodrol=1, bactivo = 1
    ).distinct()

    if not iCodPelicula:
        return JsonResponse({'success': False, 'message': 'No se proporcionó el ID de película'})
    

    detallesPelicula = CatPeliculas.objects.filter(icodpelicula=iCodPelicula)
    pelicula = [{
        'iCodPelicula': pelicula.icodpelicula,
        'tNombrePelicula': pelicula.tnombre,
        'dFechaEstreno': pelicula.dfechaestreno.strftime('%d/%m/%Y'),
        }
        for pelicula in detallesPelicula
    ]

    listaSocios = [
        {
            'iCodPersona': socio.icodpersona,
            'tNombre': socio.tnombre,
            'tNumeroTelefonico': socio.tnumerotelefonico,
            'tDireccion': socio.tdireccion,
        }
        for socio in socios
    ]

    return JsonResponse({'status': True, 'pelicula': pelicula, 'listaSocios' : listaSocios})


def guardarApartado(request):
     if request.method == 'POST':
        datos = json.loads(request.POST.get('datosApartado'))
        # print(datos)

        try:
            nuevoApartado = ProSolicitdesapartados.objects.create(
                icodpersona_id = datos['iCodPersona'],
                icodpelicula_id = datos['iCodPelicula'],
                icodestatus_id = datos['iCodEstatus'],
                dtfecharegistro = datetime.now()
            )

            copias = RelPeliculascopias.objects.filter(icodpelicula=datos['iCodPelicula'], icodestatus = 1).select_related('icodestatus')
            listaCopias = [
                {
                    'iCodPeliculaCopia': copia.icodpeliculacopia,
                    'iCodEstatus': copia.icodestatus.tnombre,
                    'dtFechaRegistro': copia.dfecharegistro.strftime('%d/%m/%Y %H:%M')
                }
                for copia in copias
            ]

            return JsonResponse({
                'status': True,
                'mensaje': 'Apartado guardado correctamente',
                'iCodSolicitudApartado': nuevoApartado.icodsolicitudapartado,
                'copias': listaCopias
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})

def guardarPrestamo(request):
    if request.method == 'POST':
        datos = json.loads(request.POST.get('datosPrestamo'))
        try:
            nuevoPrestamo = ProSolicitudesprestamos.objects.create(
                icodsolicitudapartado_id=datos['iCodSolicitudApartado'],
                icodpeliculacopia_id=datos['iCodPeliculaCopia'],
                dfechaprestamo=datos['dFechaPrestamo'],
                dtfecharegistro=datetime.now()
            )

            # 🔁 Actualizar estatus del apartado
            apartado = nuevoPrestamo.icodsolicitudapartado
            apartado.icodestatus_id = 6  # El nuevo estatus (Prestado)
            apartado.save()

            # 🔁 Actualizar estatus de la copia
            copia = nuevoPrestamo.icodpeliculacopia
            copia.icodestatus_id = 2  # El nuevo estatus (Prestado)
            copia.save()

            return JsonResponse({
                'status': True,
                'mensaje': 'Préstamo guardado correctamente',
                'iCodSolicitudPrestamo': nuevoPrestamo.icodsolicitudprestamo,
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})

    

def prestamos(request):
    prestamos = ProSolicitudesprestamos.objects.filter(dfechadevolucion__isnull=True)

    listaPrestamos = []

    for prestamo in prestamos:
        detallesPeliculaCopia = prestamo.icodpeliculacopia  # 🚨 Aquí ya no usamos get()
        detallesApartado = prestamo.icodsolicitudapartado
        detallesPelicula = detallesPeliculaCopia.icodpelicula
        detallesPersona = detallesApartado.icodpersona

        listaPrestamos.append({
            'iCodSolicitudPrestamo': prestamo.icodsolicitudprestamo,
            'iCodPeliculaCopia': detallesPeliculaCopia.icodpeliculacopia,
            'tNombrePelicula': detallesPelicula.tnombre,
            'dFechaPrestamo': prestamo.dfechaprestamo,
            'dFechaDevolucion': prestamo.dfechadevolucion,
            'dtFechaRegistro': prestamo.dtfecharegistro.strftime('%d/%m/%Y %H:%M:%S'),
            'iCodSolicitudApartado': detallesApartado.icodsolicitudapartado,
            'tNombrePersona': detallesPersona.tnombre
        })
        
    return render(request, 'EMVideoClub/prestamos.html', {'listaPrestamos': listaPrestamos})

def iniciarDevolucion(request):
    if request.method == 'POST':
        try:
            iCodSolicitudPrestamo = json.loads(request.POST.get('iCodSolicitudPrestamo'))
            prestamo = ProSolicitudesprestamos.objects.filter(icodsolicitudprestamo = iCodSolicitudPrestamo)
            listaPrestamo = []

            for detallesPrestamo in prestamo:

                detallesPeliculaCopia = detallesPrestamo.icodpeliculacopia  # 🚨 Aquí ya no usamos get()
                detallesApartado = detallesPrestamo.icodsolicitudapartado
                detallesPelicula = detallesPeliculaCopia.icodpelicula
                detallesPersona = detallesApartado.icodpersona

                listaPrestamo.append({
                    'iCodSolicitudPrestamo': detallesPrestamo.icodsolicitudprestamo,
                    'iCodPeliculaCopia': detallesPeliculaCopia.icodpeliculacopia,
                    'tNombrePelicula': detallesPelicula.tnombre,
                    'dFechaPrestamo': detallesPrestamo.dfechaprestamo.strftime('%d/%m/%Y'),
                    'dFechaDevolucion': detallesPrestamo.dfechadevolucion,
                    'dtFechaRegistro': detallesPrestamo.dtfecharegistro.strftime('%d/%m/%Y %H:%M:%S'),
                    'iCodSolicitudApartado': detallesApartado.icodsolicitudapartado,
                    'iCodPersona': detallesPersona.icodpersona,
                    'tNombrePersona': detallesPersona.tnombre,
                    'tDireccion': detallesPersona.tdireccion,
                    'tNumeroTelefonico': detallesPersona.tnumerotelefonico
                })

            return JsonResponse({
                'status': True,
                'prestamo': listaPrestamo
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def devolverPrestamo(request):
    if request.method == 'POST':
        try:
            dataDevolucion = json.loads(request.POST.get('dataDevolucion'))

            prestamo = ProSolicitudesprestamos.objects.get(icodsolicitudprestamo=dataDevolucion['iCodSolicitudPrestamo'])
            prestamo.dfechadevolucion = dataDevolucion['dFechaDevolucion']
            prestamo.save()

            # 🔁 Actualizar estatus de la copia
            copia = prestamo.icodpeliculacopia  # ya es el objeto relacionado
            copia.icodestatus_id = 1  # Estatus disponible
            copia.save()

            return JsonResponse({
                'status': True,
                'mensaje': 'Préstamo actualizado correctamente' 
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        

def apartados(request):
    apartados = ProSolicitdesapartados.objects.filter(icodestatus_id=5).select_related('icodpelicula', 'icodpersona')
    

    listaApartados = []

    for apartado in apartados:
        detallesPelicula = apartado.icodpelicula  # 🚨 Aquí ya no usamos get()
        # detallesApartado = apartado.icodsolicitudapartado
        detallesPersona = apartado.icodpersona
        copiasDisponobles = apartado.icodpelicula.relpeliculascopias_set.filter(icodestatus__icodestatus=1).count()

        listaApartados.append({
            'iCodSolicitudApartado': apartado.icodsolicitudapartado,
            'iCodPelicula' : detallesPelicula.icodpelicula,
            'tNombrePelicula': detallesPelicula.tnombre,
            'dtFechaRegistro': apartado.dtfecharegistro.strftime('%d/%m/%Y %H:%M:%S'),
            'tNombrePersona': detallesPersona.tnombre,
            'copiasDisponibles':copiasDisponobles,
            'estatusDisponibilidad': 'success' if copiasDisponobles > 0 else 'danger',
            'iconosAccion': 'Copias Disponibles' if copiasDisponobles > 0 else 'No Disponible'
        })
        
    return render(request, 'EMVideoClub/apartados.html', {'listaApartados': listaApartados})

def continuarPrestamo(request):
    if request.method == 'POST':
        try:
            iCodSolicitudApartado = json.loads(request.POST.get('iCodSolicitudApartado'))

            apartado = ProSolicitdesapartados.objects.select_related('icodpelicula', 'icodpersona').get(
                icodestatus_id=5,
                icodsolicitudapartado=iCodSolicitudApartado
            )
            pelicula = apartado.icodpelicula

            copias = RelPeliculascopias.objects.filter(
                icodpelicula=pelicula.icodpelicula,
                icodestatus=1
            ).select_related('icodestatus')

            listaCopias = [
                {
                    'iCodPeliculaCopia': copia.icodpeliculacopia,
                    'iCodEstatus': copia.icodestatus.tnombre,
                    'dtFechaRegistro': copia.dfecharegistro.strftime('%d/%m/%Y %H:%M')
                }
                for copia in copias
            ]

            return JsonResponse({
                'status': True,
                'apartado': [{
                    'iCodSolicitudApartado': apartado.icodsolicitudapartado,
                    'tNombrePelicula': pelicula.tnombre,
                    'tNombrePersona': apartado.icodpersona.tnombre,
                    'dtFechaRegistro': apartado.dtfecharegistro.strftime('%d/%m/%Y %H:%M')
                }],
                'copias': listaCopias
            })

        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def adminPeliculas(request):

    peliculas = CatPeliculas.objects.all()

    listaPeliculas = [{
        'iCodPelicula' : pelicula.icodpelicula,
        'tNombre': pelicula.tnombre,
        'dFechaEstreno': pelicula.dfechaestreno,
    }
    for pelicula in peliculas]

    # """ Nos traemos los catálogos de generos, directores y actistas """
    generos = CatGeneros.objects.all()
    listaGeneros = [{
        'iCodGenero': genero.icodgenero,
        'tNombreGenero': genero.tnombre
    }
    for genero in generos]

    directores = CatPersonas.objects.filter(
        relrolespersonas__icodrol__icodrol=2, bactivo = 1
    ).distinct()

    listadirectores = [
        {
            'iCodDirector': director.icodpersona,
            'tNombre': director.tnombre,
        }
        for director in directores
    ]

    actores = CatPersonas.objects.filter(
        relrolespersonas__icodrol__icodrol=3, bactivo = 1
    ).distinct()

    listaactores = [
        {
            'iCodActor': actor.icodpersona,
            'tNombre': actor.tnombre,
        }
        for actor in actores
    ]

    catalogos = {
        'generos' : listaGeneros,
        'actores': listaactores,
        'directores': listadirectores
    }

    return render(request, 'EMVideoClub/adminPeliculas.html', {'peliculas': listaPeliculas, 'catalogos': catalogos})

def detallesPelicula(request):
    if request.method == 'POST':
        try:
            iCodPelicula = json.loads(request.POST.get('iCodPelicula'))
            objPelicula = CatPeliculas.objects.get(icodpelicula = iCodPelicula)

            copias = []
            for copia in objPelicula.relpeliculascopias_set.all():
                copias.append({
                    'iCodPeliculaCopia': copia.icodpeliculacopia,
                    'iCodEstatus': copia.icodestatus.icodestatus,
                    'tEstatusCopia': copia.icodestatus.tnombre if copia.icodestatus else 'Sin estatus',
                    'bActivo': copia.bactivo,
                    'tNombrePelicula': objPelicula.tnombre
                })

            personas = []
            # for relacion in objPelicula.relpeliculaspersonas_set.all():
            #     rol = RelRolespersonas.objects.filter(icodpersona = relacion.icodpersona).first()
            #     personas.append({
            #         'iCodPersona': relacion.icodpersona.icodpersona,
            #         'tNombre': relacion.icodpersona.tnombre,
            #         # Si tienes rol o tipo de participación, puedes agregarlo aquí ← si se define ese campo
            #         'iCodRol': rol.icodrol.icodrol,    
            #         'tNombreRol': rol.icodrol.tnombre
            #     })

            for persona in objPelicula.relpeliculaspersonas_set.all():
                personas.append({
                    'iCodPersona': persona.icodpersona.icodpersona,
                    'tNombre': persona.icodpersona.tnombre,
                    'iCodRol': persona.icodrol.icodrol
                })

            # Géneros (asumiendo ManyToManyField directa en CatPeliculas)
            generos = [{
                'iCodGenero': genero.icodgenero,
                # 'tNombreGenero': genero.tnombre
            } for genero in objPelicula.generos.all()]
            
            pelicula = [{
                'iCodPelicula': objPelicula.icodpelicula,
                'tNombrePelicula': objPelicula.tnombre,
                'tClasificacion': objPelicula.tclasificacion,
                'dFechaEstreno' : objPelicula.dfechaestreno,
                'copias': copias,
                'generos': generos,
                'personas': personas,
            }]

            return JsonResponse({
                'status': True,
                'iCodPelicula' : iCodPelicula,
                'pelicula': pelicula
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def guardarDetallesPelicula (request):
    if request.method == 'POST':
        try:
            dataForm = json.loads(request.POST.get('dataForm'))
            dataPelicula = dataForm['pelicula']

            pelicula = CatPeliculas.objects.get(icodpelicula = dataPelicula['iCodPelicula'])
            pelicula.tnombre = dataPelicula['tNombre']
            pelicula.dfechaestreno = dataPelicula['dFechaEstreno']
            pelicula.save()

            if dataForm.get('generos'):
                RelPeliculasgeneros.objects.filter(icodpelicula_id=pelicula.icodpelicula).delete()
                for clave, valor in dataForm['generos'].items():
                    nuevoRegistroPeliculaGeneros = RelPeliculasgeneros.objects.create(
                        icodpelicula_id = pelicula.icodpelicula,
                        icodgenero_id = valor
                    )
            
            RelPeliculaspersonas.objects.filter(icodpelicula_id=pelicula.icodpelicula).delete()
            if dataForm.get('actores'):
                for clave, valor in dataForm['actores'].items():
                    nuevoRegistroPeliculaActores = RelPeliculaspersonas.objects.create(
                        icodpelicula_id = pelicula.icodpelicula,
                        icodpersona_id = valor,
                        icodrol_id = 3
                    )

            if dataForm.get('directores'):
                for clave, valor in dataForm['directores'].items():
                    nuevoRegistroPeliculaDirectores = RelPeliculaspersonas.objects.create(
                        icodpelicula_id = pelicula.icodpelicula,
                        icodpersona_id = valor,
                        icodrol_id = 2
                    )
            
        
            return JsonResponse({
                'status': True,
                'mensaje': 'Datos Actualizados',
                'data':dataForm
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        

def darBajaAltaPeliculaCopia(request):
    if request.method == 'POST':
        
        iCodPeliculaCopia = json.loads(request.POST.get('iCodPeliculaCopia'))
        bActivo = json.loads(request.POST.get('bActivo'))
        try:
            
            peliculaCopia = RelPeliculascopias.objects.get(icodpeliculacopia = iCodPeliculaCopia)
            peliculaCopia.bactivo = bActivo
            peliculaCopia.icodestatus = CatEstatus.objects.get(pk=1 if bActivo == 1 else 4)
            peliculaCopia.save()

            objPelicula = peliculaCopia.icodpelicula

            copias = []
            for copia in objPelicula.relpeliculascopias_set.all():
                copias.append({
                    'iCodPeliculaCopia': copia.icodpeliculacopia,
                    'iCodEstatus': copia.icodestatus.icodestatus,
                    'tEstatusCopia': copia.icodestatus.tnombre if copia.icodestatus else 'Sin estatus',
                    'bActivo': copia.bactivo,
                    'tNombrePelicula': objPelicula.tnombre
                })

            return JsonResponse({
                'status': True,
                'mensaje': 'Datos Actualizados',
                'iCodPelicula':peliculaCopia.icodpelicula.icodpelicula,
                'copias': copias
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def detallesPrestamo(request):
    if request.method == 'POST':
        iCodPeliculaCopia = json.loads(request.POST.get('iCodPeliculaCopia'))
        try:
            objPrestamo = ProSolicitudesprestamos.objects.filter(icodpeliculacopia = iCodPeliculaCopia)
            
            detallesPrestamo = []

            for prestamo in objPrestamo:

                detallesPeliculaCopia = prestamo.icodpeliculacopia  # 🚨 Aquí ya no usamos get()
                detallesApartado = prestamo.icodsolicitudapartado
                detallesPelicula = detallesPeliculaCopia.icodpelicula
                detallesPersona = detallesApartado.icodpersona

                detallesPrestamo.append({
                    'iCodSolicitudPrestamo': prestamo.icodsolicitudprestamo,
                    'iCodPeliculaCopia': detallesPeliculaCopia.icodpeliculacopia,
                    'iCodPelicula': detallesPelicula.icodpelicula,
                    'tNombrePelicula': detallesPelicula.tnombre,
                    'dFechaPrestamo': prestamo.dfechaprestamo.strftime('%d/%m/%Y'),
                    'dFechaDevolucion': prestamo.dfechadevolucion,
                    'dtFechaRegistro': prestamo.dtfecharegistro.strftime('%d/%m/%Y %H:%M:%S'),
                    'iCodSolicitudApartado': detallesApartado.icodsolicitudapartado,
                    'dtFechaApartado': detallesApartado.dtfecharegistro.strftime('%d/%m/%Y %H:%M:%S'),
                    'iCodPersona': detallesPersona.icodpersona,
                    'tNombrePersona': detallesPersona.tnombre,
                    'tDireccion': detallesPersona.tdireccion,
                    'tNumeroTelefonico': detallesPersona.tnumerotelefonico
                })
            return JsonResponse({
                'status': True,
                'prestamo': detallesPrestamo
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})            

def socios(request):
    socios = CatPersonas.objects.filter(
        relrolespersonas__icodrol__icodrol=1, bactivo = 1
    ).distinct()

    listaSocios = [
        {
            'iCodPersona': socio.icodpersona,
            'tNombre': socio.tnombre,
            'tNumeroTelefonico': socio.tnumerotelefonico,
            'tDireccion': socio.tdireccion,
        }
        for socio in socios
    ]

    return render(request, 'EMVideoClub/socios.html', {'nuestrosSocios': listaSocios})

def detallesSocios(request):
    if request.method == 'POST':
        try:
            iCodPersona = json.loads(request.POST.get('iCodPersona'))
            socio = CatPersonas.objects.filter(
                relrolespersonas__icodrol__icodrol=1, bactivo = 1, icodpersona = iCodPersona
                ).distinct()
            
            detallesSocios = [{
                'iCodPersona': socio.icodpersona,
                'tNombre': socio.tnombre,
                'tNumeroTelefonico': socio.tnumerotelefonico,
                'tDireccion': socio.tdireccion,
            }
            for socio in socio]

            generosFavoritos = RelPersonasgenerosfavoritos.objects.filter(
                icodpersona_id = iCodPersona
            )

            listaGenerosFavoritos = [{
                'iCodGenero': genero.icodgenero_id
            }
            for genero in generosFavoritos]

            actoresFavoritos = RelPersonasactoresfavoritos.objects.filter(
                icodpersona_id = iCodPersona
            )

            listaActoresFavoritos = [{
                'iCodActor': actor.icodactor_id
            }
            for actor in actoresFavoritos]

            directoresFavoritos = RelPersonasdirectoresfavoritos.objects.filter(
                icodpersona_id = iCodPersona
            )

            listaDirectoresFavoritos = [{
                'iCodDirector': director.icoddirectorfavorito_id
            }
            for director in directoresFavoritos]

            # """ Nos traemos los catálogos de generos, directores y actistas """
            generos = CatGeneros.objects.all()
            listaGeneros = [{
                'iCodGenero': genero.icodgenero,
                'tNombreGenero': genero.tnombre
            }
            for genero in generos]

            directores = CatPersonas.objects.filter(
                relrolespersonas__icodrol__icodrol=2, bactivo = 1
            ).distinct()

            listadirectores = [
                {
                    'iCodDirector': director.icodpersona,
                    'tNombre': director.tnombre,
                }
                for director in directores
            ]

            actores = CatPersonas.objects.filter(
                relrolespersonas__icodrol__icodrol=3, bactivo = 1
            ).distinct()

            listaactores = [
                {
                    'iCodActor': actor.icodpersona,
                    'tNombre': actor.tnombre,
                }
                for actor in actores
            ]
            
            return JsonResponse({
                'status': True,
                'socio': detallesSocios,
                'generos': listaGeneros,
                'directores': listadirectores,
                'actores': listaactores,
                'generosFavoritos': listaGenerosFavoritos,
                'actoresFavoritos': listaActoresFavoritos,
                'directoresFavoritos': listaDirectoresFavoritos
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def nuevoSocio(request):
    if request.method == 'POST':
        try:
            dataForm = json.loads(request.POST.get('dataForm'))
            persona = dataForm['persona']
            rol = dataForm['rol']

            validarPersona = CatPersonas.objects.filter(tnombre = persona['tNombre']).first()

            if validarPersona:
                isSocio = RelRolespersonas.objects.filter(icodpersona = validarPersona, icodrol_id = rol['iCodRol'])

                if isSocio.exists():
                    mensaje = 'Socio ya registrado 😁'
                else:
                    nuevoRolPersona = RelRolespersonas.objects.create(
                        icodrol_id = rol['iCodRol'],
                        icodpersona_id = validarPersona.icodpersona
                    ) 
                    mensaje = 'Se registró como socio 😁'
            else:
                nuevoSocio = CatPersonas.objects.create(
                    tnombre = persona['tNombre'],
                    tnumerotelefonico = persona['tNumeroTelefonico'],
                    tdireccion = persona['tDireccion'],
                    esexo = persona['eSexo'],
                    dfechanacimiento = persona['dFechaNacimiento'],
                    bactivo = 1,
                    dtfecharegistro = datetime.now()
                )


                nuevoRolPersona = RelRolespersonas.objects.create(
                    icodrol_id = rol['iCodRol'],
                    icodpersona_id = nuevoSocio.icodpersona
                )
                mensaje = 'Nuevo socio registrado 😁'

            return JsonResponse({'status': 'success', 'mensaje': mensaje})
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def guardarDetallesSocio(request):
    if request.method == 'POST':
        try:

            dataForm = json.loads(request.POST.get('dataForm'))

            persona = CatPersonas.objects.get(icodpersona = dataForm['iCodPersona'])
            persona.tnombre = dataForm['tNombre']
            persona.tnumerotelefonico = dataForm['tNumeroTelefonico']
            persona.tdireccion = dataForm['tDireccion']
            persona.save()

            if dataForm.get('generos'):
                RelPersonasgenerosfavoritos.objects.filter(icodpersona_id=persona.icodpersona).delete()
                for clave, valor in dataForm['generos'].items():
                    nuevoRegistroGenerosFavoritos = RelPersonasgenerosfavoritos.objects.create(
                        icodpersona_id = persona.icodpersona,
                        icodgenero_id = valor
                    )

            if dataForm.get('actores'):
                RelPersonasactoresfavoritos.objects.filter(icodpersona_id=persona.icodpersona).delete()
                for clave, valor in dataForm['actores'].items():
                    nuevoRegistroActoresFavoritos = RelPersonasactoresfavoritos.objects.create(
                        icodpersona_id = persona.icodpersona,
                        icodactor_id = valor
                    )

            if dataForm.get('directores'):
                RelPersonasdirectoresfavoritos.objects.filter(icodpersona_id=persona.icodpersona).delete()
                for clave, valor in dataForm['directores'].items():
                    nuevoRegistroDirectoresFavoritos = RelPersonasdirectoresfavoritos.objects.create(
                        icodpersona_id = persona.icodpersona,
                        icoddirectorfavorito_id = valor
                    )
            
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def agregarPelicula(request):
    if request.method == 'POST':
        try:
            dataForm = json.loads(request.POST.get('dataForm'))
            pelicula = dataForm['pelicula']

            nuevaPelicula = CatPeliculas.objects.create(
                tnombre = pelicula['tNombre'],
                dfechaestreno = pelicula['dFechaEstreno'],
                bactiva = 1,
                dtfecharegistro = datetime.now()
            )

            return JsonResponse({'status': 'success', 'mensaje': 'Película agregada con exito', 'iCodPelicula': nuevaPelicula.icodpelicula})
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})
        
def agregarCopias(request):
    if request.method == 'POST':
        try:
            dataForm = json.loads(request.POST.get('dataForm'))
            iCodPelicula = dataForm['iCodPelicula']
            numeroCopias = int(dataForm['numeroCopias'])

            # Traer objeto película
            objPelicula = CatPeliculas.objects.get(icodpelicula=iCodPelicula)

            # Crear las copias solicitadas
            for _ in range(numeroCopias):
                RelPeliculascopias.objects.create(
                    icodpelicula_id = iCodPelicula,
                    bactivo = 1,
                    dfecharegistro = datetime.now(),
                    icodestatus_id = 1
                )

                        # Traer todas las copias actualizadas
            copias = []
            for copia in objPelicula.relpeliculascopias_set.all():
                copias.append({
                    'iCodPeliculaCopia': copia.icodpeliculacopia,
                    'iCodEstatus': copia.icodestatus.icodestatus if copia.icodestatus else None,
                    'tEstatusCopia': copia.icodestatus.tnombre if copia.icodestatus else 'Sin estatus',
                    'bActivo': copia.bactivo,
                    'tNombrePelicula': objPelicula.tnombre
                })
            

            return JsonResponse({
                'status': 'success', 
                'mensaje': f'{numeroCopias} copias creadas exitosamente',
                'iCodPelicula': objPelicula.icodpelicula, 
                'copias': copias})
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})