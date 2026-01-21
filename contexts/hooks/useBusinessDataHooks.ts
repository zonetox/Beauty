// Separate hooks file to avoid initialization order issues
// This file exports hooks that depend on PublicDataContext

import { useContext } from 'react';
import { PublicDataContext, PublicDataContextType } from '../BusinessDataContext.tsx';

// Internal hook - must be used within PublicDataProvider
function usePublicData(): PublicDataContextType {
  const context = useContext(PublicDataContext);
  if (!context) {
    throw new Error('usePublicData must be used within a PublicDataProvider');
  }
  return context;
}

// Export hooks as function declarations for proper hoisting
export function useBusinessData() {
  const context = usePublicData();
  return {
    businesses: context.businesses,
    businessMarkers: context.businessMarkers,
    businessLoading: context.businessLoading,
    loading: context.businessLoading,
    totalBusinesses: context.totalBusinesses,
    currentPage: context.currentPage,
    fetchBusinesses: context.fetchBusinesses,
    addBusiness: context.addBusiness,
    updateBusiness: context.updateBusiness,
    deleteBusiness: context.deleteBusiness,
    getBusinessBySlug: context.getBusinessBySlug,
    fetchBusinessBySlug: context.fetchBusinessBySlug,
    incrementBusinessViewCount: context.incrementBusinessViewCount,
    addService: context.addService,
    updateService: context.updateService,
    deleteService: context.deleteService,
    updateServicesOrder: context.updateServicesOrder,
    addMediaItem: context.addMediaItem,
    updateMediaItem: context.updateMediaItem,
    deleteMediaItem: context.deleteMediaItem,
    updateMediaOrder: context.updateMediaOrder,
    addTeamMember: context.addTeamMember,
    updateTeamMember: context.updateTeamMember,
    deleteTeamMember: context.deleteTeamMember,
    addDeal: context.addDeal,
    updateDeal: context.updateDeal,
    deleteDeal: context.deleteDeal,
  };
}

export function useBlogData() {
  const context = usePublicData();
  return {
    blogPosts: context.blogPosts,
    blogLoading: context.blogLoading,
    loading: context.blogLoading,
    addBlogPost: context.addBlogPost,
    updateBlogPost: context.updateBlogPost,
    deleteBlogPost: context.deleteBlogPost,
    getPostBySlug: context.getPostBySlug,
    incrementViewCount: context.incrementBlogViewCount,
    comments: context.comments,
    getCommentsByPostId: context.getCommentsByPostId,
    addComment: context.addComment,
    blogCategories: context.blogCategories,
    addBlogCategory: context.addBlogCategory,
    updateBlogCategory: context.updateBlogCategory,
    deleteBlogCategory: context.deleteBlogCategory,
  };
}

export function useMembershipPackageData() {
  const context = usePublicData();
  return {
    packages: context.packages,
    addPackage: context.addPackage,
    updatePackage: context.updatePackage,
    deletePackage: context.deletePackage,
  };
}
