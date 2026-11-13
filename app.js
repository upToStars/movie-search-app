let apiKeyInput = document.querySelector('#apiKey')

let movieForma = document.querySelector('#movieForm')
let inputMovie = document.querySelector('#movieInput')
let divRezultat = document.querySelector('#rezultat')
let divDetalji = document.querySelector('#prikazDetalja')
let dugmePretrazi = document.querySelector('#dugmePretrazi')
let divSkrolovanje = document.querySelector('#scrollTrigger')

let dugmePrikaziOmiljene = document.querySelector('#prikaziOmiljene')
let divOmiljeni = document.querySelector('#omiljeniRezultat')

let trenutnaStranica = 1
let trenutnaPretraga = ''
let ucitavanje = false
let ukupnoStranice = 1

let omiljeniFilmovi =
    JSON.parse(localStorage.getItem('omiljeniFilmovi')) ?? []



movieForma.addEventListener('submit', function(e){
    e.preventDefault()

    let inputMovieValue = inputMovie.value.trim()

    if(inputMovieValue === ''){
        console.log('Ne sme biti prazno')
        return
    }

    if (!apiKeyInput.value.trim()) {
        divRezultat.textContent = 'Unesite svoj OMDb API ključ pre pretrage.'
        apiKeyInput.focus()
        return
    }

    trenutnaPretraga = inputMovieValue
    trenutnaStranica = 1

    divRezultat.style.display = 'grid'
divOmiljeni.innerHTML = ''

    inputMovie.value = ''
    inputMovie.focus()

    pretragaFilmova(inputMovieValue)
})



async function pretragaFilmova(film) {

    ucitavanje = true

    dugmePretrazi.textContent = 'Pretrazujem...'
    dugmePretrazi.disabled = true

    if(trenutnaStranica === 1){
        divRezultat.innerHTML = ''
        divDetalji.innerHTML = ''
    }

    try {

        let odgovor = await fetch(
            `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKeyInput.value.trim())}&s=${encodeURIComponent(film)}&page=${trenutnaStranica}`
        )

        if(!odgovor.ok){
            throw new Error('Doslo je do greske')
        }

        let rezultat = await odgovor.json()
ukupnoStranice = Math.ceil(Number(rezultat.totalResults || 0) / 10)

        console.log('Pretraga', rezultat)

        if(rezultat.Response === 'False'){

            if(trenutnaStranica === 1){
                divRezultat.textContent = 'Film nije pronadjen.'
            }

            return
        }

        let filmovi = rezultat.Search

        filmovi.sort(function(a, b){
            return parseInt(a.Year) - parseInt(b.Year)
        })

        filmovi.forEach(function(film){

            let kartica = napraviKarticu(film, false)

            divRezultat.appendChild(kartica)
        })


    } catch (greska) {

        console.log(greska)

        if(trenutnaStranica === 1){
            divRezultat.textContent =
                'Doslo je do greske, pokusajte ponovo'
        }

    } finally {

        ucitavanje = false

        dugmePretrazi.textContent = 'Pretrazi'
        dugmePretrazi.disabled = false
    }
}



function napraviKarticu(film, omiljeniPrikaz){

    let kartica = document.createElement('div')
    kartica.classList.add('cardForMovie')


    let naslov = document.createElement('h3')
    naslov.textContent = film.Title


    let godina = document.createElement('p')
    godina.textContent = film.Year


    let poster = document.createElement('img')

    if(film.Poster !== 'N/A'){
        poster.src = film.Poster
    } else {
        poster.alt = 'Poster nije dostupan'
        poster.style.display = 'none'
    }


    let dugmeDetalji = document.createElement('button')

    dugmeDetalji.textContent = 'Detalji'
    dugmeDetalji.classList.add('dugmeDetalji')

    dugmeDetalji.addEventListener('click', function(){
        prikaziDetalje(film.imdbID)
    })


    kartica.appendChild(dugmeDetalji)
    kartica.appendChild(naslov)
    kartica.appendChild(godina)
    kartica.appendChild(poster)


    if(omiljeniPrikaz === false){

        let dugmeOmiljeni = document.createElement('button')

        dugmeOmiljeni.textContent = 'Dodaj u omiljene'

        dugmeOmiljeni.addEventListener('click', function(){

            let postoji = omiljeniFilmovi.some(function(omiljeniFilm){
                return omiljeniFilm.imdbID === film.imdbID
            })

            if(postoji){
        dugmeOmiljeni.textContent = 'Vec je u omiljenim'
                return
            }

            omiljeniFilmovi.push(film)

            sacuvajOmiljene()

dugmeOmiljeni.textContent = 'Dodato u omiljene'

        })

        kartica.appendChild(dugmeOmiljeni)

    } else {

        let dugmeObrisi = document.createElement('button')

        dugmeObrisi.textContent = 'Ukloni iz omiljenih'

        dugmeObrisi.addEventListener('click', function(){

            omiljeniFilmovi = omiljeniFilmovi.filter(function(omiljeniFilm){
                return omiljeniFilm.imdbID !== film.imdbID
            })

            sacuvajOmiljene()

            prikaziOmiljene()
        })

        kartica.appendChild(dugmeObrisi)
    }


    return kartica
}



dugmePrikaziOmiljene.addEventListener('click', function(){
divRezultat.style.display = 'none'
    prikaziOmiljene()
})



function prikaziOmiljene(){

    divOmiljeni.innerHTML = ''

    if(omiljeniFilmovi.length === 0){
        divOmiljeni.textContent = 'Nemate omiljene filmove.'
        return
    }

    omiljeniFilmovi.forEach(function(film){

        let kartica = napraviKarticu(film, true)

        divOmiljeni.appendChild(kartica)
    })
}



async function prikaziDetalje(imdbID) {

    divDetalji.innerHTML = ''

    try {

        let odgovor = await fetch(
            `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKeyInput.value.trim())}&i=${encodeURIComponent(imdbID)}`
        )

        if(!odgovor.ok){
            throw new Error('Ne mozete videti detalje filma')
        }

        let rezultat = await odgovor.json()

        console.log('Detalji ', rezultat)

        if(rezultat.Response === 'False'){
            divDetalji.textContent = 'Detalji nisu dostupni.'
            return
        }

        function napraviElement(tag, text){

            let element = document.createElement(tag)

            element.textContent = text

            divDetalji.appendChild(element)
        }

        napraviElement('h2', `Naslov: ${rezultat.Title}`)
        napraviElement('p', `Reziser: ${rezultat.Director}`)
        napraviElement('p', `Zanr: ${rezultat.Genre}`)
        napraviElement('p', `Glumci: ${rezultat.Actors}`)
        napraviElement('p', `Vreme trajanja: ${rezultat.Runtime}`)
        napraviElement('p', `Ocena: ${rezultat.imdbRating}`)
        napraviElement('p', `Ukratko o filmu: ${rezultat.Plot}`)

    } catch (error) {

        console.log(error)

        divDetalji.textContent =
            'Doslo je do greske pri ucitavanju detalja.'
    }
}



// INFINITE SCROLL

let observer = new IntersectionObserver(function(entries){

    let entry = entries[0]

    if(
        entry.isIntersecting &&
        trenutnaPretraga !== '' &&
        ucitavanje === false &&
        trenutnaStranica < ukupnoStranice
    ){

        trenutnaStranica++

        console.log('Ucitavam stranicu:', trenutnaStranica)

        pretragaFilmova(trenutnaPretraga)
    }

})


observer.observe(divSkrolovanje)



function sacuvajOmiljene(){

    localStorage.setItem(
        'omiljeniFilmovi',
        JSON.stringify(omiljeniFilmovi)
    )
}