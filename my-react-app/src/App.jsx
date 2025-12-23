//import { useState } from 'react'
import './App.css'
//import themesData from "./themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdventCalendar from "./Tasks";
import Scoreboard from "./Christmas2025";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/nguyen_games/" element={<AdventCalendar />} />
        <Route path="/nguyen_games/scoreboard" element={<Scoreboard />} />
      </Routes>
    </BrowserRouter>
  );
}


/**
function App() {
  const [currentQuestion, setCurrentQuestion] = useState({});
  const [themes, setThemes] = useState(themesData);
  const [displayQuestion, setDisplayQuestion] = useState(false);

   const closeQuestion = (i, j) => {
    setThemes(prev => {
      const updated = structuredClone(prev); // or deep copy manually
      updated[i].questions[j].open = false;
      return updated;
    });
  };

  return (
    <>
      <div className="container">
        {themes.map((theme, i) => (  
        <div className="themes" key={i}>
          <h3>{theme.theme}</h3>
          {theme.questions.map((question, j) => (
            <div className="question" key={j}> 
            <button onClick={() => {
              setCurrentQuestion(question);
              setDisplayQuestion(true);
              closeQuestion(i, j)
              }} style={question.open ? {color: 'yellow'} : {color: 'blue'}}>  {question.points} </button>
            </div>
          )
          )}
        </div>
        ))
        }
        
      </div>
      <div className='display_question' 
      onClick={() => setDisplayQuestion(false)}
      style={displayQuestion ? {display: 'flex'} : {display: 'none'}}>
        <h1>
          {currentQuestion.question}
          </h1>
      </div>
    </>
  )
}
**/
export default App
