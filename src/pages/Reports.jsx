"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getReports } from "../firebase/services"
import StatusBadge from "../components/StatusBadge"

const Reports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: "",
    sortBy: "dateReported",
    sortDirection: "desc",
  })

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const fetchedReports = await getReports(filters)
        setReports(fetchedReports)
      } catch (error) {
        console.error("Error fetching reports:", error)
        setError("Failed to load reports. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [filters])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-green-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>

        <div className="mt-4 sm:mt-0 sm:flex sm:space-x-4">
          <div>
            <label htmlFor="status" className="sr-only">
              Filter by Status
            </label>
            <select
              id="status"
              name="status"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label htmlFor="sortBy" className="sr-only">
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Date Updated</option>
            </select>
          </div>

          <div>
            <label htmlFor="sortDirection" className="sr-only">
              Sort Direction
            </label>
            <select
              id="sortDirection"
              name="sortDirection"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              value={filters.sortDirection}
              onChange={handleFilterChange}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {reports.length > 0 ? (
            reports.map((report) => (
              <li key={report.id}>
                <Link to={`/reports/${report.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <div className="flex text-sm">
                          <p className="font-medium text-green-600 truncate">{report.id || "Untitled Report"}</p>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p className="truncate">{report.longitude + ", " +report.latitude || "No address provided"}</p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <StatusBadge status={report.status} />
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Reported by: {report.userId || "Anonymous"}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>{report.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No reports found</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default Reports

