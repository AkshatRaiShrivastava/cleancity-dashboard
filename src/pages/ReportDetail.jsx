"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getReportById,
  updateReport,
  REPORT_STATUSES,
  getUserById,
} from "../firebase/services";
import StatusBadge from "../components/StatusBadge";
import { auth } from "../firebase/config";

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newComment, setNewComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [reportUser, setReportUser] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const reportData = await getReportById(id);
        setReport(reportData);
        setNewStatus(reportData.status);
        setComments(reportData.comments || []);

        // Fetch user details if userId exists
        if (reportData.userId) {
          const userData = await getUserById(reportData.userId);
          setReportUser(userData);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
        setError("Failed to load report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [id]);

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      const statusDescription = getStatusDescription(newStatus);
      await updateReport(id, {
        status: newStatus,
        statusDescription,
      });

      // Update local report state with new status and timeline
      setReport((prev) => {
        const newStatusUpdate = {
          status: newStatus,
          description: statusDescription,
          timestamp: new Date(),
        };

        const statusUpdates = [...(prev.statusUpdates || []), newStatusUpdate];
        return {
          ...prev,
          status: newStatus,
          statusUpdates,
        };
      });
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case REPORT_STATUSES.PENDING:
        return "Report is pending review";
      case REPORT_STATUSES.UNDER_VERIFICATION:
        return "Report is under verification process";
      case REPORT_STATUSES.VERIFIED:
        return "Report has been verified";
      case REPORT_STATUSES.ACTION_TAKEN:
        return "Action has been taken on the report";
      case REPORT_STATUSES.RESOLVED:
        return "Report has been resolved successfully";
      case REPORT_STATUSES.REJECTED:
        return "Report has been rejected";
      default:
        return `Status updated to ${status}`;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case REPORT_STATUSES.RESOLVED:
        return "bg-green-500";
      case REPORT_STATUSES.REJECTED:
        return "bg-red-500";
      case REPORT_STATUSES.ACTION_TAKEN:
        return "bg-purple-500";
      case REPORT_STATUSES.VERIFIED:
        return "bg-blue-500";
      case REPORT_STATUSES.UNDER_VERIFICATION:
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      const user = auth.currentUser;

      const newCommentData = {
        author: user.displayName || user.email,
        content: newComment,
        timestamp: new Date(),
        userId: user.uid,
      };

      const updatedComments = [...comments, newCommentData];
      await updateReport(id, { comments: updatedComments });
      setComments(updatedComments);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-green-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => navigate("/reports")}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Back to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Report not found</h3>
        <button
          onClick={() => navigate("/reports")}
          className="mt-2 text-sm font-medium text-green-600 hover:text-green-500"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          {report.id || "Untitled Report"}
        </h1>
        <button
          onClick={() => navigate("/reports")}
          className="text-sm font-medium text-green-600 hover:text-green-500"
        >
          Back to Reports
        </button>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Report Details
            </h3>
            <StatusBadge status={report.status} />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Submitted on {report.createdAt.toLocaleDateString()} by{" "}
            {reportUser ? (
              <span>
                {reportUser.name} ({reportUser.email})
              </span>
            ) : (
              "Anonymous"
            )}
          </p>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {report.description || "No description provided"}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {report.location || "No location provided"}
                <p className="text-xs text-gray-500">
                  Lat: {report.latitude}, Long: {report.longitude}
                </p>
              </dd>
            </div>

            {report.imageUrl && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Image</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a
                    href={report.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={report.imageUrl}
                      alt="Report image"
                      className="h-48 w-auto object-cover rounded-md shadow-sm hover:opacity-90 transition-opacity"
                    />
                  </a>
                </dd>
              </div>
            )}

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Update Status
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center space-x-4">
                  <select
                    id="status"
                    name="status"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value={REPORT_STATUSES.PENDING}>Pending</option>
                    <option value={REPORT_STATUSES.UNDER_VERIFICATION}>
                      Under Verification
                    </option>
                    <option value={REPORT_STATUSES.VERIFIED}>Verified</option>
                    <option value={REPORT_STATUSES.ACTION_TAKEN}>
                      Action Taken
                    </option>
                    <option value={REPORT_STATUSES.RESOLVED}>Resolved</option>
                    <option value={REPORT_STATUSES.REJECTED}>Rejected</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={updating || newStatus === report.status}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </dd>
            </div>

            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status History
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-300 sm:mt-0 sm:col-span-2">
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {report.statusUpdates?.map((update, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== report.statusUpdates.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span
                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${getStatusBadgeColor(
                                  update.status
                                )}`}
                              >
                                <svg
                                  className="h-5 w-5 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {update.status
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {update.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {update.timestamp instanceof Date
                                  ? update.timestamp.toLocaleString()
                                  : new Date(update.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Comments
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Add notes or updates about this report
          </p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <form onSubmit={handleAddComment} className="space-y-4">
            <div>
              <label htmlFor="comment" className="sr-only">
                Add a comment
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={3}
                className="block w-full shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm border border-gray-300 rounded-md"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentLoading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-6">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {comment.author}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {comment.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No comments yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
