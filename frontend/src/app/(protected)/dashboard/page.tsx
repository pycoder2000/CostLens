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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const getDateRange = (range: '7d' | '30d' | '90d' | 'custom') => {
    if (range === 'custom') {
      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };
    }

    const end = new Date();
    const start = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);

    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

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

      // Only fetch costs if user has a team
      if (user.team_id) {
        const { start, end } = getDateRange(timeRange);
        console.log('Fetching costs with date range:', { start, end });

        const costsResponse = await axios.get<CostRecord[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/teams/${user.team_id}/costs`,
          {
            headers,
            params: {
              start_date: start,
              end_date: end,
            },
          }
        );
        console.log('Received costs data:', costsResponse.data);
        setCosts(costsResponse.data);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  console.log('Current costs data:', costs);
  console.log('Current time range:', timeRange);
  console.log('Current date range:', getDateRange(timeRange));

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

  // If no costs data, show a message
  if (costs.length === 0) {
    const { start, end } = getDateRange(timeRange);
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const emptyChartData = {
      labels: Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date.toLocaleDateString();
      }),
      datasets: [
        {
          label: "Daily Cost",
          data: Array(days).fill(0),
          borderColor: "rgb(79, 70, 229)",
          backgroundColor: "rgba(79, 70, 229, 0.5)",
        },
      ],
    };

    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Cost Overview
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    timeRange === '7d'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  7D
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    timeRange === '30d'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  30D
                </button>
                <button
                  onClick={() => setTimeRange('90d')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    timeRange === '90d'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  90D
                </button>
                <button
                  onClick={() => setTimeRange('custom')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    timeRange === 'custom'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom
                </button>
              </div>
              {timeRange === 'custom' && (
                <div className="flex items-center space-x-2">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        setStartDate(date);
                        setTimeRange('custom');
                      }
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    maxDate={endDate}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black"
                    dateFormat="yyyy-MM-dd"
                  />
                  <span className="text-gray-500">to</span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        setEndDate(date);
                        setTimeRange('custom');
                      }
                    }}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
              )}
              <button
                onClick={() => {
                  setLoading(true);
                  fetchData();
                }}
                className="px-4 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <div className="h-96">
            <Line options={chartOptions} data={emptyChartData} />
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Cost Overview
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === '7d'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === '30d'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === '90d'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                90D
              </button>
              <button
                onClick={() => setTimeRange('custom')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === 'custom'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
            {timeRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setStartDate(date);
                      setTimeRange('custom');
                    }
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={endDate}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black"
                  dateFormat="yyyy-MM-dd"
                />
                <span className="text-gray-500">to</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setEndDate(date);
                      setTimeRange('custom');
                    }
                  }}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            )}
            <button
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
              className="px-4 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <div className="h-96">
          <Line options={chartOptions} data={chartData} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Debug Information</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700">Current Date Range:</h4>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-sm">
              {JSON.stringify(getDateRange(timeRange), null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Raw Cost Data:</h4>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(costs, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Chart Data:</h4>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(chartData, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">API URL:</h4>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-sm">
              {`${process.env.NEXT_PUBLIC_API_URL}/teams/${user?.team_id}/costs`}
            </pre>
          </div>
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

      {/* Debug Section */}
    </div>
  );
}
