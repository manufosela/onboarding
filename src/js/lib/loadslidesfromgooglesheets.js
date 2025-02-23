// Función para cargar los datos de Google Sheets usando fetch y la API key
export async function loadSlidesFromGoogleSheets(spreadsheetId, range) {
  const apiKey = "AIzaSyDT-QgCCzknBkahozhJdNIc0aPWT-wVm7s";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en la solicitud a Google Sheets:', errorData);
      return null;
    }

    const data = await response.json();
    console.log('Datos cargados correctamente desde Google Sheets.');

    if (!data.values || data.values.length === 0) {
      console.log('No se encontraron datos en la hoja de cálculo.');
      return [];
    }

    const rows = data.values;
    const slides = [];
    let currentSlide = null;  // Mantiene referencia a la slide actual

    rows.forEach((row) => {
      const [subslideNumber, field, value] = row;

      // Si encontramos un título con subslideNumber = 0, empezamos una nueva slide
      if (field === 'title' && subslideNumber == 0) {
        // Si ya hay una slide en progreso, la guardamos antes de comenzar una nueva
        if (currentSlide) {
          slides.push(currentSlide);
        }

        // Iniciamos una nueva slide
        currentSlide = { title: value, content: [] };

      } else if (field === 'content') {
        // Si estamos agregando contenido a una nueva slide, lo añadimos
        if (subslideNumber == 0) {
          // Si el subslide es 0, añadimos el contenido a la slide principal
          currentSlide.content = value;
        } else {
          // Si es una subslide (subslideNumber > 0), añadimos a las subslides
          if (!Array.isArray(currentSlide.content)) {
            currentSlide.content = [currentSlide.content];  // Convertir el contenido en un array si es necesario
          }
          currentSlide.content.push(value);  // Agregar la subslide al array de contenido
        }
      }
    });

    // Agregar la última slide procesada
    if (currentSlide) {
      slides.push(currentSlide);
    }
    return slides;

  } catch (error) {
    console.error('Error en la solicitud:', error);
    return [];
  }
}
