import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchUserReportsFromFirestore, 
  saveUserReportToFirestore, 
  deleteUserReportFromFirestore, 
  clearUserReportsFromFirestore 
} from '../lib/firebase';
import { replaceLocalHistoryCache, getStoredHistoryReports } from '../utils/historyStorage';
import { TripReportData } from '../types';

export function useTripReportsQuery(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['userTripReports', userId || 'anonymous'];

  // React Query for fetching and caching trip reports
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return getStoredHistoryReports(userId);
      }
      const fsReports = await fetchUserReportsFromFirestore(userId);
      // Sync local storage cache for offline/instant initial state
      replaceLocalHistoryCache(fsReports, userId);
      return fsReports;
    },
    enabled: true,
    initialData: () => getStoredHistoryReports(userId),
    staleTime: 1000 * 60 * 5, // Keep cached for 5 minutes before background refetch
  });

  // Mutation for saving a single trip report
  const saveReportMutation = useMutation({
    mutationFn: async (report: TripReportData) => {
      if (!userId) return report;
      await saveUserReportToFirestore(userId, report);
      return report;
    },
    onSuccess: (savedReport) => {
      queryClient.setQueryData<TripReportData[]>(queryKey, (old = []) => {
        const filtered = old.filter(r => r.id !== savedReport.id);
        const updated = [savedReport, ...filtered];
        replaceLocalHistoryCache(updated, userId);
        return updated;
      });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for saving multiple trip reports
  const saveMultipleReportsMutation = useMutation({
    mutationFn: async (reports: TripReportData[]) => {
      if (!userId) return reports;
      await Promise.all(reports.map(r => saveUserReportToFirestore(userId, r)));
      return reports;
    },
    onSuccess: (savedReports) => {
      queryClient.setQueryData<TripReportData[]>(queryKey, (old = []) => {
        const existingMap = new Map(old.map(r => [r.id, r]));
        savedReports.forEach(r => existingMap.set(r.id, r));
        const updated = Array.from(existingMap.values());
        replaceLocalHistoryCache(updated, userId);
        return updated;
      });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for deleting a report
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      if (!userId) return reportId;
      await deleteUserReportFromFirestore(userId, reportId);
      return reportId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<TripReportData[]>(queryKey, (old = []) => {
        const updated = old.filter(r => r.id !== deletedId);
        replaceLocalHistoryCache(updated, userId);
        return updated;
      });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for clearing all reports
  const clearReportsMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await clearUserReportsFromFirestore(userId);
    },
    onSuccess: () => {
      queryClient.setQueryData<TripReportData[]>(queryKey, []);
      replaceLocalHistoryCache([], userId);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    reports: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    saveReport: saveReportMutation.mutateAsync,
    saveMultipleReports: saveMultipleReportsMutation.mutateAsync,
    deleteReport: deleteReportMutation.mutateAsync,
    clearAllReports: clearReportsMutation.mutateAsync,
  };
}
