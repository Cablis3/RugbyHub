'use client';

import { useState } from 'react';
import { czechRugbyClubs } from '../data/clubs';
import { Team } from '../types';
import { generateId } from '../lib/storage';

type Props = {
  tournamentId: string;
  currentTeams: Team[];
  onSave: (teams: Team[]) => void;
};

export function TeamSelector({ tournamentId, currentTeams, onSave }: Props) {
  const [teams, setTeams] = useState<Team[]>(currentTeams);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');

  const filteredClubs = czechRugbyClubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (clubId: string) => teams.some(t => t.clubId === clubId);

  const toggleClub = (clubId: string, clubName: string) => {
    if (isSelected(clubId)) {
      setTeams(prev => prev.filter(t => t.clubId !== clubId));
    } else {
      setTeams(prev => [...prev, { id: generateId(), tournamentId, name: clubName, clubId }]);
    }
  };

  const addCustomTeam = () => {
    const name = customName.trim();
    if (!name) return;
    setTeams(prev => [...prev, { id: generateId(), tournamentId, name }]);
    setCustomName('');
  };

  const removeTeam = (teamId: string) => setTeams(prev => prev.filter(t => t.id !== teamId));

  return (
    <div className="space-y-6">
      {/* Vybrané týmy */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">
            Vybrané týmy <span className="text-gray-500 font-normal">({teams.length})</span>
          </h3>
          <button
            onClick={() => onSave(teams)}
            className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors min-h-[36px]"
          >
            Uložit
          </button>
        </div>

        {teams.length === 0 ? (
          <p className="text-sm text-gray-500">Vyber týmy ze seznamu klubů níže nebo přidej vlastní.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map(t => (
              <span key={t.id} className="flex items-center gap-1 bg-gray-800 border border-gray-700 text-white text-sm px-3 py-1 rounded-full">
                {t.name}
                <button
                  onClick={() => removeTeam(t.id)}
                  className="ml-1 text-gray-400 hover:text-white transition-colors text-base leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800" />

      {/* Vlastní tým */}
      <div>
        <h3 className="font-semibold text-white mb-2">Přidat vlastní tým</h3>
        <div className="flex gap-2">
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomTeam()}
            placeholder="Název týmu..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
          />
          <button
            onClick={addCustomTeam}
            className="bg-gray-800 border border-gray-700 hover:border-green-600 hover:text-green-400 text-gray-300 rounded-lg px-4 py-2 text-sm transition-colors min-h-[44px]"
          >
            Přidat
          </button>
        </div>
      </div>

      <div className="border-t border-gray-800" />

      {/* Kluby ČRU */}
      <div>
        <h3 className="font-semibold text-white mb-2">Kluby ČRU</h3>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hledat klub nebo město..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors mb-2"
        />
        <div className="space-y-0 max-h-64 overflow-y-auto rounded-xl border border-gray-800">
          {filteredClubs.map((club, i) => (
            <label
              key={club.id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-800/60 last:border-0 ${
                isSelected(club.id)
                  ? 'bg-green-600/10'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected(club.id)}
                onChange={() => toggleClub(club.id, club.name)}
                className="rounded accent-green-500"
              />
              <span className="text-sm font-medium text-white flex-1">{club.name}</span>
              <span className="text-xs text-gray-500">{club.city}</span>
            </label>
          ))}
          {filteredClubs.length === 0 && (
            <p className="text-sm text-gray-500 px-3 py-4 text-center bg-gray-900">Žádný klub nenalezen.</p>
          )}
        </div>
      </div>
    </div>
  );
}
