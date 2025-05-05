# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)

class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'

################################ Modelos propios ###################################################################


class CatEstatus(models.Model):
    icodestatus = models.AutoField(db_column='iCodEstatus', primary_key=True)  # Field name made lowercase.
    tnombre = models.TextField(db_column='tNombre', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'cat_estatus'


class CatGeneros(models.Model):
    icodgenero = models.AutoField(db_column='iCodGenero', primary_key=True)  # Field name made lowercase.
    tnombre = models.TextField(db_column='tNombre')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'cat_generos'
        
    def __str__(self):
        return str(self.icodgenero)
    
class CatPersonas(models.Model):
    icodpersona = models.AutoField(db_column='iCodPersona', primary_key=True)  # Field name made lowercase.
    tnombre = models.TextField(db_column='tNombre')  # Field name made lowercase.
    tnumerotelefonico = models.TextField(db_column='tNumeroTelefonico', blank=True, null=True)  # Field name made lowercase.
    esexo = models.TextField(db_column='eSexo')  # Field name made lowercase. This field type is a guess.
    bactivo = models.IntegerField(db_column='bActivo')  # Field name made lowercase.
    dfechanacimiento = models.DateField(db_column='dFechaNacimiento')  # Field name made lowercase.
    dtfecharegistro = models.DateTimeField(db_column='dtFechaRegistro')  # Field name made lowercase.
    tdireccion = models.TextField(db_column='tDireccion')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'cat_personas'

    def __str__(self):
        return str(self.icodpersona)



class CatPeliculas(models.Model):
    icodpelicula = models.AutoField(db_column='iCodPelicula', primary_key=True)  # Field name made lowercase.
    tnombre = models.TextField(db_column='tNombre')  # Field name made lowercase.
    tclasificacion = models.TextField(db_column='tClasificacion', blank=True, null=True)  # Field name made lowercase.
    dfechaestreno = models.DateField(db_column='dFechaEstreno')  # Field name made lowercase.
    bactiva = models.IntegerField(db_column='bActiva')  # Field name made lowercase.
    dtfecharegistro = models.DateTimeField(db_column='dtFechaRegistro', blank=True, null=True)  # Field name made lowercase.

    generos = models.ManyToManyField(CatGeneros, through='RelPeliculasgeneros')
    elenco = models.ManyToManyField(CatPersonas, through='RelPeliculasPersonas')

    class Meta:
        managed = False
        db_table = 'cat_peliculas'
    
    def __str__(self):
        return str(self.icodpelicula)
    

class CatRoles(models.Model):
    icodrol = models.AutoField(db_column='iCodRol', primary_key=True)  # Field name made lowercase.
    tnombre = models.TextField(db_column='tNombre')  # Field name made lowercase.
    bactivo = models.IntegerField(db_column='bActivo')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'cat_roles'


class CatSucursales(models.Model):
    icodsucursal = models.AutoField(db_column='iCodSucursal', primary_key=True)  # Field name made lowercase.
    tnombre = models.TextField(db_column='tNombre')  # Field name made lowercase.
    tdireccion = models.TextField(db_column='tDireccion', blank=True, null=True)  # Field name made lowercase.
    bactivo = models.IntegerField(db_column='bActivo', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'cat_sucursales'

class ProSolicitdesapartados(models.Model):
    icodsolicitudapartado = models.AutoField(db_column='iCodSolicitudApartado', primary_key=True)  # Field name made lowercase.
    icodpersona = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodPersona')  # Field name made lowercase.
    icodpelicula = models.ForeignKey(CatPeliculas, models.DO_NOTHING, db_column='iCodPelicula')  # Field name made lowercase.
    icodestatus = models.ForeignKey(CatEstatus, models.DO_NOTHING, db_column='iCodEstatus')  # Field name made lowercase.
    dtfecharegistro = models.DateTimeField(db_column='dtFechaRegistro', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'pro_solicitdesapartados'


class ProSolicitudesprestamos(models.Model):
    icodsolicitudprestamo = models.AutoField(db_column='iCodSolicitudPrestamo', primary_key=True)  # Field name made lowercase.
    icodsolicitudapartado = models.ForeignKey(ProSolicitdesapartados, models.DO_NOTHING, db_column='iCodSolicitudApartado')  # Field name made lowercase.
    icodpeliculacopia = models.ForeignKey('RelPeliculascopias', models.DO_NOTHING, db_column='iCodPeliculaCopia')  # Field name made lowercase.
    dfechaprestamo = models.DateField(db_column='dFechaPrestamo')  # Field name made lowercase.
    dfechadevolucion = models.DateField(db_column='dFechaDevolucion', blank=True, null=True)  # Field name made lowercase.
    dtfecharegistro = models.DateTimeField(db_column='dtFechaRegistro', blank=True, null=True)  # Field name made lowercase.
    tobservacion = models.TextField(db_column='tObservacion', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'pro_solicitudesprestamos'


class RelPeliculascopias(models.Model):
    icodpeliculacopia = models.AutoField(db_column='iCodPeliculaCopia', primary_key=True)  # Field name made lowercase.
    icodpelicula = models.ForeignKey(CatPeliculas, models.DO_NOTHING, db_column='iCodPelicula')  # Field name made lowercase.
    bactivo = models.IntegerField(db_column='bActivo')  # Field name made lowercase.
    dfecharegistro = models.DateTimeField(db_column='dFechaRegistro', blank=True, null=True)  # Field name made lowercase.
    icodestatus = models.ForeignKey(CatEstatus, models.DO_NOTHING, db_column='iCodEstatus', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'rel_peliculascopias'
    def __str__(self):
        return f'Copia #{self.icodpeliculacopia} de {self.icodpelicula.icodpelicula}'


class RelPeliculasgeneros(models.Model):
    icodpeliculagenero = models.AutoField(db_column='iCodPeliculaGenero', primary_key=True)  # Field name made lowercase.
    icodpelicula = models.ForeignKey(CatPeliculas, models.DO_NOTHING, db_column='iCodPelicula')  # Field name made lowercase.
    icodgenero = models.ForeignKey(CatGeneros, models.DO_NOTHING, db_column='iCodGenero')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'rel_peliculasgeneros'
    
    def __str__(self):
        return f'Genero de {self.icodpelicula.tnombre} de {self.icodgenero.tnombre}'
    


class RelPeliculaspersonas(models.Model):
    icodpeliculapersona = models.AutoField(db_column='iCodPeliculaPersona', primary_key=True)  # Field name made lowercase.
    icodpelicula = models.ForeignKey(CatPeliculas, models.DO_NOTHING, db_column='iCodPelicula')  # Field name made lowercase.
    icodpersona = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodPersona')  # Field name made lowercase.
    icodrol = models.ForeignKey(CatRoles, models.DO_NOTHING, db_column='iCodRol')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'rel_peliculaspersonas'

    # def __str__(self):
    #     return f'{self.icodpersona.tnombre} - {self.rol.tnombre} en {self.icodpelicula.tnombre}'


class RelPersonasactoresfavoritos(models.Model):
    icodpersonaactorfavorito = models.AutoField(db_column='iCodPersonaActorFavorito', primary_key=True)  # Field name made lowercase.
    icodpersona = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodPersona')  # Field name made lowercase.
    icodactor = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodActor', related_name='relpersonasactoresfavoritos_icodactor_set')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'rel_personasactoresfavoritos'


class RelPersonasdirectoresfavoritos(models.Model):
    icodpersonadirectorfavorito = models.AutoField(db_column='iCodPersonaDirectorFavorito', primary_key=True)  # Field name made lowercase.
    icodpersona = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodPersona')  # Field name made lowercase.
    icoddirectorfavorito = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodDirectorFavorito', related_name='relpersonasdirectoresfavoritos_icoddirectorfavorito_set')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'rel_personasdirectoresfavoritos'


class RelPersonasgenerosfavoritos(models.Model):
    icodpersonagenerofavorito = models.AutoField(db_column='iCodPersonaGeneroFavorito', primary_key=True)  # Field name made lowercase.
    icodpersona = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodPersona')  # Field name made lowercase.
    icodgenero = models.ForeignKey(CatGeneros, models.DO_NOTHING, db_column='iCodGenero')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'rel_personasgenerosfavoritos'


class RelRolespersonas(models.Model):
    icodrolpersona = models.AutoField(db_column='iCodRolPersona', primary_key=True)  # Field name made lowercase.
    icodrol = models.ForeignKey(CatRoles, models.DO_NOTHING, db_column='iCodRol')  # Field name made lowercase.
    icodpersona = models.ForeignKey(CatPersonas, models.DO_NOTHING, db_column='iCodPersona')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'rel_rolespersonas'