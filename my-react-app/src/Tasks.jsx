
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Tasks.css"; // ensure this file exists and is imported once

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
      const correct = String(password) === String(freshTask.password || "");
      if (!correct) {
        setMessage("Incorrect password. Try again.");
        setSubmitting(false);
        return;
      }

      // Award points to scoreboard (table: scoreboard with columns team, score)
      const teamName = team.trim();

      const { data: existing, error: existErr } = await supabase
        .from("scoreboard")
        .select("team, score")
        .eq("team", teamName)
        .maybeSingle();

      if (existErr) {
        console.error(existErr);
        setMessage("Failed to check scoreboard.");
        setSubmitting(false);
        return;
      }

      if (existing) {
        const newScore = (existing.score || 0) + (freshTask.points || 0);
        const { error: updErr } = await supabase
          .from("scoreboard")
          .update({ score: newScore })
          .eq("team", teamName);

        if (updErr) {
          console.error(updErr);
          setMessage("Failed to update score.");
          setSubmitting(false);
          return;
        }
      } else {
        const { error: insErr } = await supabase
          .from("scoreboard")
          .insert({ team: teamName, score: freshTask.points || 0 });

        if (insErr) {
          console.error(insErr);
          setMessage("Failed to create score.");
          setSubmitting(false);
          return;
        }
      }

      setMessage("✅ Correct! +" + freshTask.points + " points awarded to " + teamName + ".");
      setTimeout(() => {
        setOpenTask(null);
        setSubmitting(false);
      }, 1000);
    } catch (e) {
      console.error(e);
      setMessage("Something went wrong. Please try again.");
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
              aria-label={"Task " + t.number}
            >
              <span className="tile-number">{t.number}</span>
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
            <h2 id="modal-title">Task #{openTask.number}</h2>
            <p className="modal-points">
              Worth <strong>{openTask.points}</strong> points
            </p>

            <div className="modal-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter task password"
                disabled={submitting}
              />
            </div>

            {message && <p className="modal-message">{message}</p>}

            <div className="modal-actions">
              <button
                className="modal-btn modal-btn--primary"
                onClick={submitPassword}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send"}
              </button>
              <button
                className="modal-btn modal-btn--ghost"
                onClick={() => (!submitting ? setOpenTask(null) : null)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}