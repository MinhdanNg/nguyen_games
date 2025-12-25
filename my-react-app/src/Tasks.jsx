
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Tasks.css"; // ensure this file exists and is imported once
import { Link } from "react-router-dom";

// Read env vars (Vite exposes only vars that start with VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("Missing VITE_SUPABASE_ANON_KEY");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdventCalendar() {
  // Team (nickname) stored locally so refresh doesn't reset
  const [team, setTeam] = useState(() => localStorage.getItem("team") || "");

  // Tasks from Supabase
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Modal state
  const [openTask, setOpenTask] = useState(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  function saveTeamName(value) {
    setTeam(value);
    localStorage.setItem("team", value);
  }

  async function loadTasks() {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from("task")
      .select()
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("Could not load tasks. Please try again.");
    } else {
      setTasks(data || []);
    }
    setLoadingTasks(false);
  }

  function onTileClick(task) {
    setOpenTask(task);
    setPassword("");
    setMessage("");
  }

  function normalize(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // remove spaces & punctuation
    .trim();
}

  // Submit password and award points to scoreboard
  async function submitPassword() {
    if (!openTask) return;
    if (!team.trim()) {
      setMessage("Please enter your team name first.");
      return;
    }
    if (!password.trim()) {
      setMessage("Please enter a password.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      // Re-fetch the task to validate against current values
      const { data: freshTask, error: taskErr } = await supabase
        .from("task")
        .select()
        .eq("id", openTask.id)
        .single();

      if (taskErr || !freshTask) {
        setMessage("Task not found. Please try again.");
        setSubmitting(false);
        return;
      }

      // Simple client-side password check (OK for your one-time event)
      const input = normalize(password);

      const accepted = Array.isArray(freshTask.password)
        ? freshTask.password
        : JSON.parse(freshTask.password || "[]");

      const correct = accepted.some((answer) => {
        return normalize(answer) === input;
      });

      // Award points to scoreboard (table: scoreboard with columns team, score)
      const teamName = team.trim();

      const { data: existing, error: existErr } = await supabase
        .from("scoreboard")
        .select()
        .eq("team", teamName)
        .maybeSingle();

      if (existErr) {
        console.error(existErr);
        setMessage("Failed to check scoreboard.");
        setSubmitting(false);
        return;
      }

      if (!correct) {
        setMessage("Incorrect password. Try again.");
        setSubmitting(false);
        const newScore = (existing.score || 0) - 1;

        const { error: updErr } = await supabase
          .from("scoreboard")
          .update({ 
            score: newScore,
           })
          .eq("team", teamName);

          if (updErr) {
          console.error(updErr);
          setMessage("ops en feil oppstod. prøv igjen...");
          setSubmitting(false);
          return;
        }
        return;
      }

      const completed = existing?.completed_tasks || [];
      if (completed.includes(freshTask.id)) {
        setMessage("Du har allerede gjort denne oppgaven!");
        setSubmitting(false);
        return;
      }

      console.log(completed)
      console.log(freshTask.id)
      console.log(completed.includes(freshTask.id))

      if (existing) {
        const newScore = (existing.score || 0) + (freshTask.points || 0);
        const newCompletedTasks = [...completed, freshTask.id];

        const { error: updErr } = await supabase
          .from("scoreboard")
          .update({ 
            score: newScore,
            completed_tasks: newCompletedTasks 
           })
          .eq("team", teamName);

        if (updErr) {
          console.error(updErr);
          setMessage("ops en feil oppstod. prøv igjen...");
          setSubmitting(false);
          return;
        }
      } else {
        const { error: insErr } = await supabase
          .from("scoreboard")
          .insert({ team: teamName, score: freshTask.points || 0 });

        if (insErr) {
          console.error(insErr);
          setMessage("ops en feil oppstod. prøv igjen...");
          setSubmitting(false);
          return;
        }
      }

      setMessage("✅ Riktig! +" + freshTask.points + " poeng til " + teamName + ".");
      setTimeout(() => {
        setOpenTask(null);
        setSubmitting(false);
      }, 1000);
    } catch (e) {
      console.error(e);
      setMessage("ops en feil oppstod. prøv igjen...");
      setSubmitting(false);
    }
  }

  return (
    <div className="advent-root">
      <header className="advent-header">
        <h1>🎄 Advent Task Calendar</h1>
        <p className="advent-subtitle">Tap a number, enter the password, win points.</p>
        <div className="team-input">
          <label htmlFor="team">Team/Nickname</label>
          <input
            id="team"
            placeholder="e.g., Snow Angels"
            value={team}
            onChange={(e) => saveTeamName(e.target.value)}
          />
        </div>
      </header>

      {loadingTasks ? (
        <p className="loading">Loading tasks…</p>
      ) : (
        <section className="advent-grid">
          {tasks.map((t) => (
            <button
              key={t.id}
              className={"advent-tile " + (t.active === false ? "advent-tile--inactive" : "")}
              onClick={() => (t.active === false ? null : onTileClick(t))}
              aria-label={"Task " + t.id}
            >
              <span className="tile-number">{t.id}</span>
              <span className="tile-dot" aria-hidden />
            </button>
          ))}
        </section>
      )}

      {openTask && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => (!submitting ? setOpenTask(null) : null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 id="modal-title">Oppgave {openTask.id}</h2>
            <p className="modal-points">
              Verdt <strong>{openTask.points}</strong> poeng
            </p>

            <div className="modal-field">
              <input
                id="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tast inn passordet"
                disabled={submitting}
                autoComplete="off"
              />
            </div>

            {message && <p className="modal-message">{message}</p>}

            <div className="modal-actions">
              <button
                className="modal-btn modal-btn--primary"
                onClick={submitPassword}
                disabled={submitting}
              >
                {submitting ? "Sender…" : "Send"}
              </button>
              <button
                className="modal-btn modal-btn--ghost"
                onClick={() => (!submitting ? setOpenTask(null) : null)}
                disabled={submitting}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}