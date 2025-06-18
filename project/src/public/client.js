const store = {
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
}

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}


// create content
const App = (state) => {
    let { rovers, apod } = state

    return `
        <header>
            <h1>Mars Mission Control</h1>
        </header>
        <section>
            <p>Welcome to the Mars Mission Control Center. Here you can find information about the rovers currently on Mars and
            the Astronomy Picture of the Day.</p>
            
            <h2>Rovers</h2>
            <p>Here is a list of the rovers currently on Mars:</p>
            ${RoverButtons(rovers)}

            <h2>Image of the Day</h2>
            ${ImageOfTheDay(apod)}
            
        </section>
        <footer>Data courtesy of NASA</footer>
    `
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    getImageOfTheDay(store);
})


// ------------------------------------------------------  COMPONENTS

// Image of the Day component
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    //also check if theres an error in the response
    const today = new Date().toLocaleDateString('en-CA');

    if (apod.loading) return `<p>Loading...</p>`;
    if (apod.error) return `<p>Failed to load image. Please try again later.</p>`;
    if (!apod.image.date || apod.image.date !== today) return `<p>Image is outdated. Please refresh later.</p>`;
    

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
        `)
    }
}

// Rover buttons component
const RoverButtons = (rovers) => {
    return `
        <div id="rover-buttons">
            ${rovers.map((rover) => {
                return `<button class="rover-button" id="${rover}" onclick="roverInfo('${rover}')">${rover}</button>`
            }).join('')}
        </div>
        <div id="rover-info">Click on a Rover button to see information.</div>
        <div id="rover-photos"></div>
    `
}   



// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = async (state) => {
    updateStore(store, { apod: { loading: true } }); // Set loading state
    try {
        const res = await fetch(`http://localhost:3000/apod`);
        const data = await res.json();
        if (data.error) {
            console.error("Error fetching APOD:", data.error);
            updateStore(store, { apod: { error: true, loading: false } });
            return;
        }
        // Store only valid image data
        updateStore(store, { apod: { ...data, loading: false, error: false } });
    } catch (err) {
        console.error("Failed to fetch APOD:", err);
    }
};

const isImageAccessible = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
};

const roverInfo = async (roverName) => {
    try {
        const res = await fetch(`http://localhost:3000/rover/${roverName}`);
        const data = await res.json();
        
        const roverPhotos = data.rover.photos;
        const roverInfo = data.rover.photos[0].rover;
        const roverDate = data.rover.photos[0].earth_date;

        // Add Rover information to the page
        const roverInfoDiv = document.getElementById('rover-info');
        roverInfoDiv.innerHTML = `
            <h3>${roverInfo.name}</h3>
            <p>Launch Date: ${roverInfo.launch_date}</p>
            <p>Landing Date: ${roverInfo.landing_date}</p>
            <p>Status: ${roverInfo.status}</p>
            <p>Photos taken on ${roverDate}: ${roverPhotos.length}</p>
        `;

        // check if images are loading
        const accessiblePhotos = [];
        for (let photo of roverPhotos.slice(0, 20)) {
            const ok = await isImageAccessible(photo.img_src);
            if (ok) accessiblePhotos.push(photo);
        }

        // add rover photos to the page if they load successfully
        const roverPhotosDiv = document.getElementById('rover-photos');
        if (accessiblePhotos.length === 0) {
            roverPhotosDiv.innerHTML = `<p>No viewable images available.</p>`;
            return;
        }
        roverPhotosDiv.innerHTML = `
            <h4>Photos</h4>
            <div class="photos">
                ${accessiblePhotos.slice(0, 6).map(photo => `
                    <img src="${photo.img_src}" alt="Mars Rover Photo" />
                `).join('')}
            </div>
        `;
        
    } catch (err) {
        console.error("Failed to fetch Rover:", err);
    }
};