from django.contrib import admin
from pprint import pprint

# Register your models here.
from .models import CatPersonas, CatPeliculas, CatGeneros, CatRoles, ProSolicitdesapartados, RelPeliculascopias, RelPeliculasgeneros, RelPeliculaspersonas, RelRolespersonas

####### RELACION DE MODELOS
class RelPeliculasCopiasInline(admin.TabularInline):
    model = RelPeliculascopias
    extra = 1


######## MODELOS ADMIN
class CatPeliculasAdmin(admin.ModelAdmin):
    list_display = ('tnombre', 'dfechaestreno', 'mostrarGeneros', 'mostrar_elenco')
    inlines = [RelPeliculasCopiasInline]
    search_fields = ('tnombre',)
    list_filter = ('icodpelicula','dfechaestreno',)

    def mostrarGeneros(self,obj):
        return ', '.join([g.tnombre for g in obj.generos.all()])
    mostrarGeneros.short_description = 'Géneros'

    def mostrar_elenco(self, obj):
        personas  = RelPeliculaspersonas.objects.filter(icodpelicula=obj)
        resultado = []
        for persona in personas:
            icodpersona = persona.icodpersona
            roles = RelRolespersonas.objects.filter(icodpersona = icodpersona)
            nombrepersona = CatPersonas.objects.filter(icodpersona = str(persona.icodpersona))
            for rol in roles:
                icodrol = rol.icodrol.icodrol
                nombrerol = CatRoles.objects.filter(icodrol = icodrol)
                resultado.append(f"{nombrerol[0].tnombre}: {nombrepersona[0].tnombre}")
        return ", ".join(resultado)

    mostrar_elenco.short_description = 'Elenco y roles'

class CatPersonaAdmin(admin.ModelAdmin):
    list_display = ('tnombre', 'tnumerotelefonico', 'esexo', 'dfechanacimiento', 'tdireccion')
    search_fields = ('tnombre', 'tnumerotelefonico', 'esexo', 'tdireccion',)
    list_filter = ('dfechanacimiento',)



admin.site.register(CatGeneros)
admin.site.register(CatPersonas,CatPersonaAdmin)
admin.site.register(CatPeliculas, CatPeliculasAdmin)
admin.site.register(RelPeliculascopias)
admin.site.register(RelPeliculasgeneros)
admin.site.register(ProSolicitdesapartados)