'use client';

import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface AWSResource {
  id: number;
  name: string;
  arn: string;
  service: string;
  team_id: number | null;
}

interface Team {
  id: number;
  name: string;
}

export default function ResourcesPage() {
  const { user, token } = useAuth();
  const [resources, setResources] = useState<AWSResource[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch resources
        const resourcesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/resources`, { headers });
        setResources(resourcesResponse.data);

        // Fetch teams
        const teamsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teams`, { headers });
        setTeams(teamsResponse.data);
      } catch (error) {
        console.error('Error fetching resources data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleTeamChange = async (resourceId: number, teamId: number | null) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/resources/${resourceId}/team/${teamId}`, {}, { headers });

      setResources((prevResources) =>
        prevResources.map((resource) =>
          resource.id === resourceId
            ? { ...resource, team_id: teamId }
            : resource
        )
      );
    } catch (error) {
      console.error('Error updating resource team:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          AWS Resources
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
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Service
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ARN
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
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {resource.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resource.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resource.arn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={resource.team_id || ''}
                        onChange={(e) =>
                          handleTeamChange(
                            resource.id,
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        disabled={user?.role !== 'admin' && user?.role !== 'team_lead'}
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
  );
}