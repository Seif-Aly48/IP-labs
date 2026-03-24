const { useState, useEffect } = React;

function StarRating({ rating, setRating }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'active' : ''}`}
          onClick={() => setRating(star)}
          role="button"
          tabIndex={0}
        >
          {star <= rating ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  );
}

function MovieItem({ movie, onRemove, onUpdate }) {
  const [comment, setComment] = useState(movie.comment || '');
  const [isEditingComment, setIsEditingComment] = useState(false);

  const handleRating = (newRating) => {
    onUpdate(movie.id, { ...movie, rating: newRating });
  };

  const saveComment = () => {
    onUpdate(movie.id, { ...movie, comment });
    setIsEditingComment(false);
  };

  return (
    <div className="movie-card glass-panel">
      <div className="movie-header">
        <h3 className="movie-title">{movie.title}</h3>
        <button className="icon-btn remove-btn" onClick={() => onRemove(movie.id)} title="Remove movie">✕</button>
      </div>
      
      <div className="movie-rating-section">
        <span className="rating-label">Rating:</span>
        <StarRating rating={movie.rating} setRating={handleRating} />
        {movie.rating > 0 && <span className="rating-text">({movie.rating} stars)</span>}
      </div>

      <div className="movie-comment-section">
        <div className="comment-header">
          <span className="comment-label">Review:</span>
          {!isEditingComment && (
            <button className="text-btn" onClick={() => setIsEditingComment(true)}>
              {comment ? 'Edit' : 'Add Comment'}
            </button>
          )}
        </div>
        
        {isEditingComment ? (
          <div className="comment-edit">
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of the movie?"
              rows="3"
            />
            <button className="primary-btn small" onClick={saveComment}>Save</button>
          </div>
        ) : (
          <p className="comment-text">{comment ? `"${comment}"` : <span className="no-comment">No review yet.</span>}</p>
        )}
      </div>
    </div>
  );
}

function App() {
  const [movies, setMovies] = useState(() => {
    const saved = localStorage.getItem('moviesWatchlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('moviesWatchlist', JSON.stringify(movies));
  }, [movies]);

  const addMovie = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    const newMovie = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      rating: 0,
      comment: ''
    };
    
    setMovies([newMovie, ...movies]);
    setNewTitle('');
  };

  const removeMovie = (id) => {
    setMovies(movies.filter(m => m.id !== id));
  };

  const updateMovie = (id, updatedMovie) => {
    setMovies(movies.map(m => m.id === id ? updatedMovie : m));
  };

  return (
    <div className="app-container">
      <header className="app-header glass-panel">
        <h1>🍿 Popcorn Watchlist</h1>
        <p>Save movies you watch along with your rating and reviews.</p>
      </header>

      <main className="app-main">
        <form onSubmit={addMovie} className="add-movie-form glass-panel">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter movie title..."
            className="movie-input"
          />
          <button type="submit" className="primary-btn">Add Movie</button>
        </form>

        <div className="movies-list">
          {movies.length === 0 ? (
            <div className="empty-state glass-panel">
              <span className="empty-icon">🎬</span>
              <h2>Your watchlist is empty</h2>
              <p>Add your first movie above!</p>
            </div>
          ) : (
            movies.map(movie => (
              <MovieItem 
                key={movie.id} 
                movie={movie} 
                onRemove={removeMovie}
                onUpdate={updateMovie}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
