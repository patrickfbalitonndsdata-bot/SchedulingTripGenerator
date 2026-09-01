import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getStoredHistoryReports, 
  saveReportToHistory, 
  saveMultipleReportsToHistory,
  deleteSingleHistoryRecord, 
  clearAllHistoryRecords 
} from '../utils/historyStorage';
import { TripReportData } from '../types';

export function useTripReportsQuery(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['userTripReports', userId || 'anonymous'];

  // React Query for caching locally stored trip reports
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      return getStoredHistoryReports(userId);
    },
    enabled: true,
    initialData: () => getStoredHistoryReports(userId),
    staleTime: 1000 * 60 * 5,
  });

  // Mutation for saving a single trip report
  const saveReportMutation = useMutation({
    mutationFn: async (report: TripReportData) => {
      saveReportToHistory(report, userId);
      return report;
    },
    onSuccess: () => {
      queryClient.setQueryData<TripReportData[]>(queryKey, getStoredHistoryReports(userId));
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for saving multiple trip reports
  const saveMultipleReportsMutation = useMutation({
    mutationFn: async (reports: TripReportData[]) => {
      saveMultipleReportsToHistory(reports, userId);
      return reports;
    },
    onSuccess: () => {
      queryClient.setQueryData<TripReportData[]>(queryKey, getStoredHistoryReports(userId));
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for deleting a report
  const deleteReportMutation = useMutation({
    mutationFn: async (report: TripReportData) => {
      deleteSingleHistoryRecord(report, {
        date: report.dateOfSchedule,
        tech: report.technician,
        fileName: report.fileName
      }, userId);
      return report;
    },
    onSuccess: () => {
      queryClient.setQueryData<TripReportData[]>(queryKey, getStoredHistoryReports(userId));
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for clearing all reports
  const clearReportsMutation = useMutation({
    mutationFn: async () => {
      clearAllHistoryRecords(userId);
    },
    onSuccess: () => {
      queryClient.setQueryData<TripReportData[]>(queryKey, []);
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

