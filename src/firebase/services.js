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
    return {
      id: reportDoc.id,
      ...reportData,
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

    await updateDoc(reportRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });

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
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      ...userData,
      createdAt: userData.createdAt?.toDate() || new Date(),
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
    // Get total reports count
    const reportsSnapshot = await getDocs(collection(db, "reports"));
    const totalReports = reportsSnapshot.size;

    // Get reports by status
    const pendingQuery = query(
      collection(db, "reports"),
      where("status", "==", "pending")
    );
    const inProgressQuery = query(
      collection(db, "reports"),
      where("status", "==", "in_progress")
    );
    const resolvedQuery = query(
      collection(db, "reports"),
      where("status", "==", "resolved")
    );

    const pendingSnapshot = await getDocs(pendingQuery);
    const inProgressSnapshot = await getDocs(inProgressQuery);
    const resolvedSnapshot = await getDocs(resolvedQuery);

    // Get total users count
    const usersSnapshot = await getDocs(collection(db, "users"));

    return {
      totalReports,
      pendingReports: pendingSnapshot.size,
      inProgressReports: inProgressSnapshot.size,
      resolvedReports: resolvedSnapshot.size,
      totalUsers: usersSnapshot.size,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};
