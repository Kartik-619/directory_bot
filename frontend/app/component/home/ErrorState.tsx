interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
  }
  
  export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
    return (
      <div className="error-message">
        <p>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            Try Again
          </button>
        )}
      </div>
    );
  };