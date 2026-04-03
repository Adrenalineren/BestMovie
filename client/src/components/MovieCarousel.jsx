import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../assets/MovieCarousel.css'

function MovieCarousel({ movies }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-scroll every 5 seconds
    useEffect(() => {
        if (movies.length === 0) return;
        
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [movies.length]);

    if (movies.length === 0) return null;

    const currentMovie = movies[currentIndex];

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
    };

    return (
        <div className='carousel-container'>
            <Link 
                to={`/movies/${currentMovie._id}`} 
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <div className='carousel-slide'>
                    <img src={currentMovie.poster} alt={currentMovie.title} className='carousel-image' />
                    <div className='carousel-overlay'>
                        <h1>{currentMovie.title}</h1>
                        <p>{currentMovie.description}</p>
                        <div className='carousel-info'>
                            <span className='carousel-rating'>Rating: {currentMovie.ageRating}</span>
                            <span className='carousel-duration'>{currentMovie.duration} mins</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Navigation Buttons */}
            <button className='carousel-btn prev' onClick={handlePrev}>❮</button>
            <button className='carousel-btn next' onClick={handleNext}>❯</button>

            {/* Dots Indicator */}
            <div className='carousel-dots'>
                {movies.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
}

export default MovieCarousel
