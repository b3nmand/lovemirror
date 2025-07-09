import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import '@/App.css';

function App() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ 
          background: 'linear-gradient(90deg, #ff0099, #9900ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Love Mirror
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Discover your relationship compatibility and growth areas
        </p>
      </div>
      
      <Button
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6 sm:px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 text-white [&_svg]:text-white"
        onClick={() => navigate('/assessment')}
      >
        Start Assessment
      </Button>
    </div>
  );
}

export default App;