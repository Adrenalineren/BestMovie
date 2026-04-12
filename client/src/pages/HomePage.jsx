import { useState, useEffect } from 'react'
import '../assets/HomePage.css'
import { Link } from 'react-router-dom'
import G from '../assets/images/G.svg'
import PG from '../assets/images/PG.svg'
import PG13 from '../assets/images/PG13.svg'
import NC16 from '../assets/images/NC16.svg'
import M18 from '../assets/images/M18.svg'
import R21 from '../assets/images/R21.svg'
import MovieCarousel from '../components/MovieCarousel';


function HomePage() {
    const [movies, setMovies] = useState([]);
    const [selectedTab, setSelectedTab] = useState('now-showing');

    const ageRatingImages = {
        'G': G,
        'PG': PG,
        'PG13': PG13,
        'NC16': NC16,
        'M18': M18,
        'R21': R21
    };

    const getFilteredMovies = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedTab === 'now-showing') {
            return movies.filter(movie => {
                const releaseDate = new Date(movie.releaseDate);
                const leavingDate = movie.leavingCinema ? new Date(movie.leavingCinema) : null;
                // Movie is "Now Showing" if: released AND (no leaving date OR leaving date is in future)
                return releaseDate <= today && (!leavingDate || leavingDate >= today);
            });
        } else if (selectedTab === 'coming-soon') {
            return movies.filter(movie => {
                const releaseDate = new Date(movie.releaseDate);
                return releaseDate > today;
            });
        }
        return movies;
    };

    const filteredMovies = getFilteredMovies();

    useEffect(() => {
        fetch('http://localhost:3000/api/movies')
            .then(res => res.json())
            .then(data => {
                console.log('Movies fetched:', data);
                data.forEach(m => console.log(`Movie: ${m.title}, Rating: ${m.ageRating}`));
                setMovies(data);
            })
            .catch(err => console.error('Error fetching movies:', err));
    }, []);

    return (
        <div>
            <MovieCarousel movies={movies} />
            
            {/* Filter Tabs */}
            <div className='filter-tabs'>
                <button 
                    className={selectedTab === 'now-showing' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setSelectedTab('now-showing')}
                >
                    Now Showing
                </button>
                <button 
                    className={selectedTab === 'coming-soon' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setSelectedTab('coming-soon')}
                >
                    Coming Soon
                </button>
            </div>

            <div className='home-page'>
                {filteredMovies.map(movie => (
                    <Link 
                        to={`/movies/${movie._id}`} 
                        key={movie._id}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div>
                            <img src={movie.poster} alt={movie.title} />
                            <h2>{movie.title}</h2>  
                            <p className="age-rating">
                                <img 
                                    src={ageRatingImages[movie.ageRating] || G} 
                                    alt={movie.ageRating}
                                    className="rating-badge"
                                />
                            </p>
                            <p>Duration: {movie.duration} minutes</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default HomePage