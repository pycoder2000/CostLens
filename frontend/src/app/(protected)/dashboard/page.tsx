"use client";

import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CostRecord {
  id: number;
  date: string;
  team_id: number;
  service: string;
  amount: number;
}

interface Team {
  id: number;
  name: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams
        const teamsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/teams`
        );
        setTeams(teamsResponse.data);

        // Fetch costs for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const costsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/teams/${user?.team_id}/costs`,
          {
            params: {
              start_date: thirtyDaysAgo.toISOString(),
              end_date: new Date().toISOString(),
            },
          }
        );
        setCosts(costsResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const chartData = {
    labels: Array.from(
      new Set(costs.map((cost) => new Date(cost.date).toLocaleDateString()))
    ),
    datasets: [
      {
        label: "Daily Cost",
        data: costs.map((cost) => cost.amount),
        borderColor: "rgb(79, 70, 229)",
        backgroundColor: "rgba(79, 70, 229, 0.5)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "AWS Costs Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Cost (USD)",
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Cost Overview
        </h2>
        <div className="h-96">
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">
                      {team.name[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {team.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $
                      {costs
                        .filter((cost) => cost.team_id === team.id)
                        .reduce((sum, cost) => sum + cost.amount, 0)
                        .toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
