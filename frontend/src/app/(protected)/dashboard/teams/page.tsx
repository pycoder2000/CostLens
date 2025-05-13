"use client";

import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { useEffect, useState } from "react";

interface Team {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  role?: string;
  team_id: number | null;
  password: string;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.access_token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${user.access_token}` };

        // Fetch teams
        const teamsResponse = await axios.get<Team[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/teams`,
          { headers }
        );
        setTeams(teamsResponse.data);

        // Only fetch users if admin
        if (user.role === "admin") {
          const usersResponse = await axios.get<User[]>(
            `${process.env.NEXT_PUBLIC_API_URL}/users`,
            { headers }
          );
          setUsers(usersResponse.data);
        }
        setError(null);
      } catch (error) {
        console.error("Error fetching teams data:", error);
        setError("Failed to fetch teams data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.access_token) {
      setError("Authentication required");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${user.access_token}` };
      const response = await axios.post<Team>(
        `${process.env.NEXT_PUBLIC_API_URL}/teams`,
        {
          name: newTeamName,
          description: newTeamDescription,
        },
        { headers }
      );
      setTeams([...teams, response.data]);
      setNewTeamName("");
      setNewTeamDescription("");
      setError(null);
    } catch (error) {
      console.error("Error creating team:", error);
      setError("Failed to create team");
    }
  };

  const handleAssignUser = async (userId: number, teamId: number | null) => {
    if (!user?.access_token) {
      setError("Authentication required");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${user.access_token}` };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/team/${teamId}`,
        {},
        { headers }
      );

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, team_id: teamId } : user
        )
      );
      setError(null);
    } catch (error) {
      console.error("Error assigning user to team:", error);
      setError("Failed to assign user to team");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user?.role === "admin" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Create New Team
            </h3>
            <form onSubmit={handleCreateTeam} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="team-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Team Name
                </label>
                <input
                  type="text"
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2.5 px-3 text-gray-900"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="team-description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="team-description"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Team
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Teams</h3>
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Members
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {team.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {
                          users.filter((user) => user.team_id === team.id)
                            .length
                        }{" "}
                        members
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {user?.role === "admin" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              User Team Assignments
            </h3>
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Team
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <select
                            value={user.team_id || ""}
                            onChange={(e) =>
                              handleAssignUser(
                                user.id,
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="">Unassigned</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
