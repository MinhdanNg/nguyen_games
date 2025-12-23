import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import './Christmas2025.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function App() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    getTeams();
  }, []);

  async function getTeams() {
    const { data } = await supabase
    .from("scoreboard")
    .select()
    .order("score", {ascending: false});
    setTeams(data);
  }

  return (
 
<div className="scoreboard">
  <header className="sb-header">
    <h1>🎄 Christmas Scoreboard</h1>
  </header>
  
<ul className="sb-list">
  {teams.map((row, idx) => {
    const rankclassName =
      idx === 0 ? "sb-item sb-item--top1" :
      idx === 1 ? "sb-item sb-item--top2" :
      idx === 2 ? "sb-item sb-item--top3" :
      "sb-item";
    return (
      <li key={row.id ?? row.team} className={rankclassName}>
        <span className="sb-rank">{idx + 1}</span>
        <span className="sb-team">{row.team}</span>
        <span className="sb-score">{row.score}</span>
      </li>
    );
  })}
  </ul>
<div className="snowflakes" aria-hidden="true">
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
  <div className="snowflake">
    <div className="inner">❅</div>
  </div>
</div>
</div>
  );
}
export default App;