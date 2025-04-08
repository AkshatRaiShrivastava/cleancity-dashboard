import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

export const REPORT_STATUSES = {
  PENDING: "pending",
  UNDER_VERIFICATION: "under_verification",
  VERIFIED: "verified",
  ACTION_TAKEN: "action_taken",
  RESOLVED: "resolved",
  REJECTED: "rejected",
};

// Reports
export const getReports = async (filters = {}) => {
  try {
    let reportsQuery = collection(db, "reports");

    // Apply filters if provided
    if (filters.status) {
      reportsQuery = query(reportsQuery, where("status", "==", filters.status));
    }

    if (filters.sortBy) {
      reportsQuery = query(
        reportsQuery,
        orderBy(filters.sortBy, filters.sortDirection || "desc")
      );
    } else {
      reportsQuery = query(reportsQuery, orderBy("dateReported", "desc"));
    }

    if (filters.limit) {
      reportsQuery = query(reportsQuery, limit(filters.limit));
    }

    const snapshot = await getDocs(reportsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

export const getReportById = async (reportId) => {
  try {
    const reportDoc = await getDoc(doc(db, "reports", reportId));

    if (!reportDoc.exists()) {
      throw new Error("Report not found");
    }

    const reportData = reportDoc.data();

    // Convert timestamps in status updates
    const statusUpdates =
      reportData.statusUpdates?.map((update) => ({
        ...update,
        timestamp: update.timestamp?.toDate() || new Date(),
      })) || [];

    return {
      id: reportDoc.id,
      ...reportData,
      statusUpdates,
      createdAt: reportData.createdAt?.toDate() || new Date(),
      updatedAt: reportData.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error;
  }
};

export const updateReport = async (reportId, data) => {
  try {
    const reportRef = doc(db, "reports", reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      throw new Error("Report not found");
    }

    const reportData = reportSnap.data();

    // Update the report first
    await updateDoc(reportRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Add status update to history
    if (data.status && data.status !== reportData.status) {
      const statusUpdates = reportData.statusUpdates || [];
      statusUpdates.push({
        status: data.status,
        timestamp: serverTimestamp(), // Use serverTimestamp instead of Timestamp.now()
        description:
          data.statusDescription || `Report marked as ${data.status}`,
      });

      await updateDoc(reportRef, {
        statusUpdates,
      });
    }

    // If status is being changed to resolved, update user's incentives
    if (
      data.status === REPORT_STATUSES.RESOLVED &&
      reportData.status !== REPORT_STATUSES.RESOLVED &&
      reportData.userId
    ) {
      const userRef = doc(db, "users", reportData.userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const currentIncentives = userSnap.data().incentives || 0;
        await updateDoc(userRef, {
          incentives: currentIncentives + 25,
          updatedAt: Timestamp.now(),
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating report:", error);
    throw error;
  }
};

export const addCommentToReport = async (reportId, comment) => {
  try {
    const reportRef = doc(db, "reports", reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      throw new Error("Report not found");
    }

    const commentsCollection = collection(reportRef, "comments");
    await addDoc(commentsCollection, {
      ...comment,
      createdAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const getReportComments = async (reportId) => {
  try {
    const commentsCollection = collection(db, `reports/${reportId}/comments`);
    const commentsQuery = query(
      commentsCollection,
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(commentsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

// Users
export const getUsers = async () => {
  try {
    const usersCollection = collection(db, "users");
    const usersQuery = query(usersCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(usersQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return null;
    }
    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const updateUserStatus = async (userId, isActive) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isActive: isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

// Dashboard stats
export const getDashboardStats = async () => {
  try {
    const reportsSnapshot = await getDocs(collection(db, "reports"));
    const totalReports = reportsSnapshot.size;

    // Get reports by all statuses
    const statusQueries = await Promise.all(
      Object.values(REPORT_STATUSES).map(async (status) => {
        const statusQuery = query(
          collection(db, "reports"),
          where("status", "==", status)
        );
        const snapshot = await getDocs(statusQuery);
        return { [status]: snapshot.size };
      })
    );

    const statusCounts = statusQueries.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {}
    );

    // Get total users count
    const usersSnapshot = await getDocs(collection(db, "users"));

    return {
      totalReports,
      totalUsers: usersSnapshot.size,
      pendingReports: statusCounts[REPORT_STATUSES.PENDING] || 0,
      underVerificationReports:
        statusCounts[REPORT_STATUSES.UNDER_VERIFICATION] || 0,
      verifiedReports: statusCounts[REPORT_STATUSES.VERIFIED] || 0,
      actionTakenReports: statusCounts[REPORT_STATUSES.ACTION_TAKEN] || 0,
      resolvedReports: statusCounts[REPORT_STATUSES.RESOLVED] || 0,
      rejectedReports: statusCounts[REPORT_STATUSES.REJECTED] || 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};
