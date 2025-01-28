import './App.css';
import Nav from './component/nav';
import Home from './component/home';
import Signup from './component/Signup';
//import UserProfile from './component/UserProfile1';
import Signin from './component/Signin';
import UserDashboard from './component/UserDashboard';
import PostContent from './component/PostContent';
//import YourContent from './component/YourContent1';
import Notifications from './component/Notifications';
import PostVisited from './component/PostVisited';


import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
    <div className="App">
      <header className="App-header">
      
       <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/userDashboard" element={<UserDashboard />} />
        <Route path="/postContent" element={<PostContent/>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/postVisited" element={<PostVisited />} />
       </Routes>
        
       </header> 
        
    </div>
    </Router>
  );
}

export default App;
