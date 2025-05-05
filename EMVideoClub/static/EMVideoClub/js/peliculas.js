let datosSocios = {};
let funcGenerales;
$(document).ready(function () {
    const funcvideoClub = new videoClub();
    funcGenerales = new funcionesGenerales();
});

class videoClub {
    
    constructor(){
        this.iniciarPlugins();
        this.iniciarEventos();
    }
    
    iniciarPlugins(){
        $('.datatable').DataTable({
            'responsive': true,
            'autoWidth':false,
            'paging': true
        });
    }
    
    iniciarEventos(){
        let self = this;
        // console.log(self)

        $.ajaxSetup({
            headers: { "X-CSRFToken": $('[name=csrfmiddlewaretoken]').val() }
        });

        //Filtro para las películas
        $('#filtroPeliculas').on('keyup', function(){

            let filtro = $(this).val().toLowerCase();
            $('#contenedorPeliculas .item-pelicula').each(function() {
                let texto = $(this).text().toLowerCase();
                if (texto.includes(filtro)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });

        $('#contenedorPeliculas').on('click','.item-pelicula', function(){
            let iCodPelicula = $(this).attr('id').split('-')[1];

            // Reiniciamos el formulario y los socios para que haya basura
            $('#formApartado, #formPrestamo').find('input, select, textarea').not('#iCodEstatus').each(function(){
                if($(this).is('input')){
                    $(this).val('');
                }
                if($(this).is('select')){
                    $(this).html('').append('<option value="">- Seleccionar -</option>');
                }
            });
            $('#nav-socio').show();
            $('#nav-copia').hide();
            $('#tab-socio-tab').tab('show');

            datosSocios = {};

            if(iCodPelicula){
                $.ajax({
                    method:'post',
                    url:'/peliculas/iniciarPrestamo/',
                    data:{
                        iCodPelicula:iCodPelicula
                    },
                    dataType:'json',
                    beforeSend: ()=>{
                        Swal.fire({
                            title: 'Cargando información',
                            text: 'Espere un momento..',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            didOpen: ()=>{
                                Swal.showLoading();
                            }
                        });
                    },
                    success: (response)=>{
                        Swal.close();

                        //Empezamos a rellenar los datos
                        self.rellenarDatos(response.pelicula,'modalBodyContent');
                        self.generarOptionsPersonas(response.listaSocios)

                        $('#modalGeneral').modal('show');
                    },
                    error: (xhr, status, error)=>{
                        console.error("Ocurrió un error:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups...',
                            text: 'Algo salió mal al obtener los detalles 😢',
                        });
                    }
                });
            }
        });

        $('#iCodPersona').on('change',function(){
            let iCodPersona = $(this).val();
            if(iCodPersona){
                self.rellenarDatos(datosSocios[iCodPersona],'divDatosPersona')
            }else{
                $('#divDatosPersona').find('input, select, textarea').each(function(){
                    $(this).val('')
                });
            }
        });

        $('#formApartado').on('submit', function(event){
            event.preventDefault()
            let datosApartado = funcGenerales.mapSerializedToJSON($(this).serializeArray());

            // console.log(datosApartado);

            if(Object.keys(datosApartado).length > 0){
                Swal.fire({
                    icon: 'question',
                    title:'¿Los datos del socio son correctos?',
                    text:'Confirme si son correctos, si no corrijan los datos',
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Confirmar',
                    cancelButtonText: 'Cancelar',
                }).then((result) =>{
                    if(result.isConfirmed){
                        $.ajax({
                            method:'post',
                            url:'/peliculas/guardarApartado/',
                            data: {
                                datosApartado: JSON.stringify(datosApartado)
                            },
                            dataType: 'json',
                            beforeSend: ()=>{
                                Swal.fire({
                                    title: 'Guardando información',
                                    text: 'Espere un momento..',
                                    showConfirmButton: false,
                                    allowOutsideClick: false,
                                    didOpen: ()=>{
                                        Swal.showLoading();
                                    }
                                });
                            },
                            success: (response) =>{
                                console.log(response);
                                if(response.copias.length > 0){
                                    Swal.fire({
                                        icon: 'success',
                                        title: `${response.mensaje}: ID de apartado: ${response.iCodSolicitudApartado}`,
                                        text: 'Ahora eliga la copia',
                                        showConfirmButton: true
                                    });
                                    $('#nav-socio').hide();
                                    $('#nav-copia').show();
                                    $('#tab-copia-tab').tab('show');
                                    $('#iCodSolicitudApartado').val(response.iCodSolicitudApartado);
                                    self.generarOptionsCopias(response.copias);
                                }else{
                                    Swal.fire({
                                        icon: 'warning',
                                        title: 'Por el momento no tenemos copias disponibles 😞📼',
                                        text: 'Su solicitud para aparta una copia ya está registrada 🥳',
                                        showConfirmButton: true,
                                    }).then((result) => {
                                        if(result.isConfirmed){
                                            $('#modalGeneral').modal('hide');
                                            location.reload();
                                        }
                                    }); 
                                }
                            }
                        });
                    }
                });
            }
        });

        $('#formPrestamo').on('submit', function(event){
            event.preventDefault()
            let datosPrestamo = funcGenerales.mapSerializedToJSON($(this).serializeArray());
            // console.log(datosPrestamo);
            if(Object.keys(datosPrestamo).length > 0){
                Swal.fire({
                    icon: 'warning',
                    title: 'Confirmar préstamo',
                    text: 'Desea confirmar el préstamo de la copia',
                    showConfirmButton: true,
                    showCancelButton: true,
                }).then((result)=>{
                    if(result.isConfirmed){
                        $.ajax({
                            method:'post',
                            url: '/peliculas/guardarPrestamo/',
                            data: {
                                datosPrestamo: JSON.stringify(datosPrestamo)
                            },
                            dataType: 'json',
                            beforeSend: ()=>{
                                Swal.fire({
                                    title: 'Guardando información',
                                    text: 'Espere un momento..',
                                    showConfirmButton: false,
                                    allowOutsideClick: false,
                                    didOpen: ()=>{
                                        Swal.showLoading();
                                    }
                                });
                            },
                            success: (response)=>{
                                // console.log(response);
                                Swal.fire({
                                    icon:'success',
                                    title: `${response.mensaje}, ID de préstamo: ${response.iCodSolicitudPrestamo}`,
                                    text: 'Que disfrute su película, favor de devolverla.',
                                    showConfirmButton: true,
                                    allowOutsideClick: false
                                }).then((result) =>{
                                    if(result.isConfirmed){
                                        $('#modalGeneral').modal('hide');
                                        location.reload();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    generarOptionsPersonas(listaSocios){
        let optionsHTML = '';  // string para acumular los <option>
        listaSocios.forEach((socio) => {
            datosSocios[socio.iCodPersona] = [socio];
            optionsHTML += `<option value="${socio.iCodPersona}">${socio.tNombre}</option>`;
        });
        
        $('#iCodPersona').append(optionsHTML);
    }
    generarOptionsCopias(listaCopias){
        let optionsHTML = '';  // string para acumular los <option>
        listaCopias.forEach((copia) => {
            // datosSocios[socio.iCodPersona] = [socio];
            optionsHTML += `<option value="${copia.iCodPeliculaCopia}">PC-${copia.iCodPeliculaCopia}</option>`;
        });
        
        $('#iCodPeliculaCopia').append(optionsHTML);
    }

    rellenarDatos(arrayDatos, contenedor){

        arrayDatos.forEach((datos, index) => {
            for (let [clave, valor] of Object.entries(datos)) {

                let $elemento = $(`#${contenedor}`).find((`#${clave}`));
                if ($elemento.length > 0) {
                    if ($elemento.is('input, select, textarea')) {
                        $elemento.val(valor);
                    } else if ($elemento.is('img')) {
                        $elemento.attr('src', valor);
                    } else if ($elemento.is('a')) {
                        $elemento.attr('href', valor).text(valor);
                    } else {
                        $elemento.text(valor);
                    }
                }
            }
        });
    }
}

class funcionesGenerales{

    /**
    * Serializa todos los elementos con el atributo "name" dentro de un selector especificado.
    * 
    * Esta función está diseñada para casos donde no se puede utilizar el método serializeArray() 
    * directamente sobre un formulario, como en bloques de HTML dinámicos o estructuras más específicas.
    * 
    * - Incluye inputs, selects, checkboxes y radios con el atributo "name".
    * - Los checkboxes y radios solo se consideran si están marcados.
    * - Devuelve un array plano con objetos { name, value }, ignorando elementos sin valor válido.
    * 
    * @param {string} selector - Selector CSS del contenedor donde se encuentran los elementos a serializar.
    * @returns {Array} Array de objetos con el formato { name: string, value: string }.
    * 
    * Ejemplo de uso:
    * let data = serializeNamedElements('.miClaseBloque');
    * let data = serializeNamedElements('#miDivBloque');
    * console.log(data);
    * 
    * -ASP-
    */
    serializeNamedElements(selector) {
        return $(selector).find('[name]').map(function () {
            const isCheckboxOrRadio = $(this).is(':checkbox') || $(this).is(':radio');
            const value = isCheckboxOrRadio ? ($(this).is(':checked') ? $(this).val() : null) : $(this).val();
    
            // Incluir solo si el valor es válido
            return value ? { name: $(this).attr('name'), value } : null;
        }).get(); // Devuelve un array plano
    }
    
    /**
    * Convierte datos serializados en un objeto JSON organizado por 'name'.
    * @param {Array} serializedData - Datos serializados (name, value).
    * @returns {Object} Objeto JSON estructurado.
    * 
    * -ASP-
    */
    
    mapSerializedToJSON(serializedData) {
        const dataForm = {};
    
        serializedData.forEach(({ name, value }) => {
            if (value !== '') {
            const keys = name.split('[').map((key) => key.replace(']', ''));
            keys.reduce((acc, key, index) => {
                if (index === keys.length - 1) {
                acc[key] = value; // Asignar valor en la última clave
                } else {
                acc[key] = acc[key] || {}; // Crear objeto si no existe
                }
                return acc[key];
            }, dataForm);
            }
        });
    
        return dataForm;
    }
}
