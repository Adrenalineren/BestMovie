import { useParams } from "react-router-dom";   
import { useState, useEffect } from "react";
import '../assets/MovieDetail.css'
import G from '../assets/images/G.svg'
import PG from '../assets/images/PG.svg'
import PG13 from '../assets/images/PG13.svg'
import NC16 from '../assets/images/NC16.svg'
import M18 from '../assets/images/M18.svg'
import R21 from '../assets/images/R21.svg'
import SeatSelection from '../components/SeatSelection';


function MovieDetail() {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [screenings, setScreenings] = useState([]);
    const [selectedHallType, setSelectedHallType] = useState(null);
    const [hallTypes, setHallTypes] = useState([]);
    const [selectedScreening, setSelectedScreening] = useState(null);
    
    // Map age ratings to imported image files
    const ageRatingImages = {
        'G': G,
        'PG': PG,
        'PG13': PG13,
        'NC16': NC16,
        'M18': M18,
        'R21': R21
    };

    // Convert 24-hour time to 12-hour AM/PM format
    const convertTo12Hour = (time24) => {
        if (!time24) return time24;
        const [hours, minutes] = time24.split(':');
        let hour = parseInt(hours);
        const minute = minutes;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        return `${hour}:${minute} ${ampm}`;
    };

    // Format date to readable format (e.g., "Friday 03-04-2026")
    const formatDateWithDay = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[date.getDay()];
        return `${dayName} ${dateStr}`;
    };
    
    useEffect(() => {
        // Fetch movie details
        fetch(`http://localhost:3000/api/movies/${id}`)
            .then(res => res.json())
            .then(data => setMovie(data))
            .catch(err => console.error('Error fetching movie details:', err));

        // Fetch screenings for this movie
        fetch(`http://localhost:3000/api/screenings/movie/${id}`)
            .then(res => res.json())
            .then(data => {
                console.log('Screenings fetched:', data);
                setScreenings(data);
                
                // Extract unique hall types
                const types = [...new Set(data.map(s => s.hallType || 'Standard'))].sort();
                setHallTypes(types);
                if (types.length > 0) {
                    setSelectedHallType(types[0]);
                }
            })
            .catch(err => console.error('Error fetching screenings:', err));
    }, [id]);

    // Group screenings by date for selected hall type
    const getScreeningsByType = () => {
        return screenings.filter(s => s.hallType === selectedHallType)
            .reduce((acc, screening) => {
                if (!acc[screening.date]) {
                    acc[screening.date] = [];
                }
                acc[screening.date].push(screening);
                return acc;
            }, {});
    };

    const handleSelectScreening = (screening) => {
        setSelectedScreening(screening);
    };

    const handleSelectSeats = (seats, hall) => {
        console.log('Selected seats:', seats);
        console.log('Hall:', hall);
        // Here you can add functionality to proceed to checkout/booking
        // For now, just close the modal
        setSelectedScreening(null);
    };

    if (!movie) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div className='movie-detail-page'>
                {/* Header with Title and Age Rating */}
                <div className='movie-detail-header'>
                    <h1>{movie.title}</h1>
                    <p className="age-rating-badge">
                        <img 
                            src={ageRatingImages[movie.ageRating] || G} 
                            alt={movie.ageRating}
                            className="rating-badge"
                        />
                    </p>
                </div>

                {/* Main Container - Poster Left, Details Right */}
                <div className='movie-detail-container'>
                    {/* Left - Poster */}
                    <div className='movie-detail-poster'>
                        <img src={movie.poster} alt={movie.title} />
                    </div>

                    {/* Right - Details and Synopsis */}
                    <div className='movie-detail-right'>
                        {/* Details Section */}
                        <div className='movie-detail-info'>
                            <h2>Details</h2>
                            <div className='detail-row'>
                                <span className='detail-label'>Cast: </span>
                                <span className='detail-value'>{Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast || 'N/A'}</span>
                            </div>
                            <div className='detail-row'>
                                <span className='detail-label'>Director: </span>
                                <span className='detail-value'>{movie.director || 'N/A'}</span>
                            </div>
                            <div className='detail-row'>
                                <span className='detail-label'>Genre: </span>
                                <span className='detail-value'>{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'N/A'}</span>
                            </div>
                            <div className='detail-row'>
                                <span className='detail-label'>Language: </span>
                                <span className='detail-value'>{movie.language || 'N/A'}</span>
                            </div>
                            <div className='detail-row'>
                                <span className='detail-label'>Release: </span>
                                <span className='detail-value'>{movie.releaseDate || 'N/A'}</span>
                            </div>
                            <div className='detail-row'>
                                <span className='detail-label'>Running Time: </span>
                                <span className='detail-value'>{movie.duration} minutes</span>
                            </div>
                        </div>

                        {/* Synopsis Section */}
                        <div className='movie-summary'>
                            <h2>Synopsis</h2>
                            <p>{movie.summary}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="showtimes">
                <div className="showtimes-container">
                    {/* Left Panel - Cinema Types */}
                    <div className="cinema-types-panel">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                            </svg>
                            Select a cinema
                        </h3>
                        <div className="cinema-types-list">
                            {hallTypes.map(type => (
                                <button
                                    key={type}
                                    className={`cinema-type-btn ${selectedHallType === type ? 'active' : ''}`}
                                    onClick={() => setSelectedHallType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Showtimes */}
                    <div className="showtimes-panel">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-alarm-fill" viewBox="0 0 16 16">
                                <path d="M6 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H9v1.07a7.001 7.001 0 0 1 3.274 12.474l.601.602a.5.5 0 0 1-.707.708l-.746-.746A6.97 6.97 0 0 1 8 16a6.97 6.97 0 0 1-3.422-.892l-.746.746a.5.5 0 0 1-.707-.708l.602-.602A7.001 7.001 0 0 1 7 2.07V1h-.5A.5.5 0 0 1 6 .5m2.5 5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9zM.86 5.387A2.5 2.5 0 1 1 4.387 1.86 8.04 8.04 0 0 0 .86 5.387M11.613 1.86a2.5 2.5 0 1 1 3.527 3.527 8.04 8.04 0 0 0-3.527-3.527"/>
                            </svg>
                            Select time slot for {movie?.title}
                        </h3>
                        {selectedHallType && Object.entries(getScreeningsByType()).length > 0 ? (
                            <div className="showtimes-by-date">
                                {Object.entries(getScreeningsByType())
                                    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                                    .map(([date, dateScreenings]) => (
                                        <div key={date} className="date-group">
                                            <h4>{formatDateWithDay(date)}</h4>
                                            <div className="time-slots">
                                                {dateScreenings.map(screening => (
                                                    <button
                                                        key={screening._id}
                                                        className="time-slot-btn"
                                                        onClick={() => handleSelectScreening(screening)}
                                                    >
                                                        {convertTo12Hour(screening.screeningTime)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p>No showtimes available for {selectedHallType}</p>
                        )}
                    </div>
                </div>
            </div>
            {selectedScreening && (
                <SeatSelection 
                    screening={selectedScreening}
                    movieTitle={movie.title}
                    moviePrice={movie?.price}
                    onClose={() => setSelectedScreening(null)}
                    onSelectSeats={handleSelectSeats}
                />
            )}
        </>
    )
}

export default MovieDetail;