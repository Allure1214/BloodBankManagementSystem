import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminDashboardLayout';
import { 
  Activity, 
  Droplet, 
  Users, 
  Calendar, 
  Building2, 
  TrendingUp, 
  Download, 
  Filter 
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    donationTrends: [],
    bloodTypeDistribution: [],
    userGrowth: [],
    campaignPerformance: [],
    bloodBankStats: [],
    monthlyComparison: [],
    userDemographics: { ageDistribution: [], genderDistribution: [] }
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    totalBloodBanks: 0,
    activeCampaigns: 0,
    totalCampaigns: 0,
    userGrowth: 0,
    donationGrowth: 0
  });

  const BLOOD_COLORS = {
    'A+': '#ef4444',
    'A-': '#f97316',
    'B+': '#84cc16',
    'B-': '#06b6d4',
    'AB+': '#6366f1',
    'AB-': '#a855f7',
    'O+': '#ec4899',
    'O-': '#f43f5e'
  };

  useEffect(() => {
    fetchReportData();
  }, [timeframe, reportType]);
  

  // Debug function to log data structure
  const debugData = (data, stats) => {
    console.log('Reports Data:', data);
    console.log('Reports Stats:', stats);
    console.log('Blood Type Distribution:', data.bloodTypeDistribution);
    console.log('Donation Trends:', data.donationTrends);
    console.log('User Growth:', data.userGrowth);
    console.log('Campaign Performance:', data.campaignPerformance);
  };

  // Validate and clean blood type data
  const validateBloodTypeData = (data) => {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      name: item.name || item.bloodType || 'Unknown',
      value: parseInt(item.value || item.count || item.amount || 0)
    })).filter(item => item.value > 0);
  };

  // Process real campaign data from CSV files
  const processCampaignData = (campaigns, reservations) => {
    console.log('Processing campaigns:', campaigns);
    console.log('Processing reservations:', reservations);
    
    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      console.log('No campaigns data available');
      return [];
    }
    
    return campaigns.map(campaign => {
      // Find reservations for this campaign
      const campaignReservations = reservations?.data?.filter(res => res.campaign_id === campaign.id) || [];
      console.log(`Campaign ${campaign.id} (${campaign.location}) has ${campaignReservations.length} reservations`);
      
      // Count total participants
      const totalParticipants = campaignReservations.length;
      
      // Count completed donations
      const completedDonations = campaignReservations.filter(res => res.donation_completed === 1).length;
      
      // Count confirmed reservations
      const confirmedReservations = campaignReservations.filter(res => res.status === 'confirmed').length;
      
      // Calculate success rate
      const successRate = totalParticipants > 0 ? (completedDonations / totalParticipants * 100).toFixed(1) : 0;
      
      // Clean up campaign name for better display
      let cleanName = campaign.location || `Campaign ${campaign.id}`;
      
      // Fix common typos and standardize names
      if (cleanName.includes('OTUS DESA TERBAU')) {
        cleanName = 'LOTUS DESA TERBAU';
      } else if (cleanName.includes('SLEE TAMAN DAYA')) {
        cleanName = 'MASLEE TAMAN DAYA';
      }
      
      // Standardize AEON naming
      if (cleanName.toLowerCase().includes('aeon')) {
        cleanName = cleanName.toUpperCase();
      }
      
      // Remove duplicate locations by standardizing format
      if (cleanName.includes('JOHOR BAHRU - ')) {
        cleanName = cleanName.replace('JOHOR BAHRU - ', '');
      }
      
      // Create a shorter display name for charts
      const displayName = cleanName.length > 15 ? 
        cleanName.substring(0, 15) + '...' : 
        cleanName;
      
      const result = {
        campaign: cleanName,
        displayName: displayName, // For chart display
        donations: completedDonations,
        participants: totalParticipants,
        confirmed: confirmedReservations,
        successRate: parseFloat(successRate),
        location: campaign.location,
        organizer: campaign.organizer,
        isActive: campaign.is_active === 1
      };
      
      console.log(`Campaign ${campaign.id} result:`, result);
      return result;
    }).filter(campaign => campaign.participants > 0) // Only show campaigns with participants
      .sort((a, b) => b.donations - a.donations) // Sort by donations descending
      .filter((campaign, index, self) => 
        // Remove duplicate campaigns with same name
        index === self.findIndex(c => c.campaign === campaign.campaign)
      );
  };

  // Process blood type data from campaign reservations
  const processBloodTypeFromReservations = (reservations) => {
    console.log('Processing blood types from reservations:', reservations);
    
    if (!reservations?.data || !Array.isArray(reservations.data)) {
      console.log('No reservations data available for blood type processing');
      return [];
    }
    
    const bloodTypeCounts = {};
    
    reservations.data.forEach(reservation => {
      if (reservation.blood_type && reservation.blood_type !== 'UNKNOWN') {
        bloodTypeCounts[reservation.blood_type] = (bloodTypeCounts[reservation.blood_type] || 0) + 1;
      }
    });
    
    const result = Object.entries(bloodTypeCounts).map(([bloodType, count]) => ({
      name: bloodType,
      value: count
    })).sort((a, b) => b.value - a.value);
    
    console.log('Blood type counts:', bloodTypeCounts);
    console.log('Processed blood type data:', result);
    
    return result;
  };

  // Process user profile data for demographics
  const processUserDemographics = (userProfiles) => {
    console.log('Processing user profiles for demographics:', userProfiles);
    
    if (!userProfiles || !Array.isArray(userProfiles)) {
      console.log('No user profiles data available for demographics processing');
      return { ageDistribution: [], genderDistribution: [] };
    }
    
    // Process age distribution
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46+': 0
    };
    
    // Process gender distribution
    const genderCounts = {
      'male': 0,
      'female': 0
    };
    
          userProfiles.forEach(profile => {
        if (profile.date_of_birth) {
          const birthDate = new Date(profile.date_of_birth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        
        if (age >= 18 && age <= 25) ageGroups['18-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 45) ageGroups['36-45']++;
        else if (age >= 46) ageGroups['46+']++;
      }
      
      if (profile.gender && profile.gender.toLowerCase() !== 'null') {
        const gender = profile.gender.toLowerCase();
        if (gender === 'male' || gender === 'female') {
          genderCounts[gender]++;
        }
      }
    });
    
          const ageDistribution = Object.entries(ageGroups).map(([ageGroup, count]) => ({
        name: ageGroup,
        value: count,
        color: ageGroup === '18-25' ? '#3b82f6' : 
               ageGroup === '26-35' ? '#10b981' : 
               ageGroup === '36-45' ? '#f59e0b' : '#ef4444'
      })).filter(item => item.value > 0);
      
      const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({
        name: gender.charAt(0).toUpperCase() + gender.slice(1),
        value: count,
        color: gender.toLowerCase() === 'male' ? '#3b82f6' : '#ec4899'
      })).filter(item => item.value > 0);
    
    console.log('Age distribution:', ageDistribution);
    console.log('Gender distribution:', genderDistribution);
    
    return { ageDistribution, genderDistribution };
  };

    const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch dashboard stats (real data)
      const dashboardResponse = await fetch(`http://localhost:5000/api/admin/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch campaign data for real campaign performance
      const campaignResponse = await fetch('http://localhost:5000/api/admin/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch campaign reservations for detailed analytics
      const reservationsResponse = await fetch('http://localhost:5000/api/admin/campaigns/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch user profiles for demographics
      const userProfilesResponse = await fetch('http://localhost:5000/api/admin/users/profiles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Debug API responses
      console.log('Campaign Response Status:', campaignResponse.status);
      console.log('Reservations Response Status:', reservationsResponse.status);
      console.log('User Profiles Response Status:', userProfilesResponse.status);
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        if (dashboardData.success) {
          setStats(dashboardData.data);
          
          // Debug: Log the entire dashboard response
          console.log('Dashboard API Response:', dashboardData);
          console.log('Dashboard Data Structure:', dashboardData.data);
          console.log('Total Campaigns from API:', dashboardData.data.totalCampaigns);
          console.log('Users Data Available:', dashboardData.data.users);
          
          // Create user growth data from actual user creation dates
          let userGrowthData = [];
          if (dashboardData.data.users && Array.isArray(dashboardData.data.users)) {
            // Group users by creation month (only regular users, not admins)
            const userCountsByMonth = {};
            dashboardData.data.users.forEach(user => {
              if (user.role !== 'user') return; // Skip admins and superadmins
              const createdAt = new Date(user.created_at);
              const monthKey = createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              userCountsByMonth[monthKey] = (userCountsByMonth[monthKey] || 0) + 1;
            });
            
            // Convert to chart format
            Object.entries(userCountsByMonth).forEach(([month, count]) => {
              userGrowthData.push({ month, users: count });
            });
            
            // Sort by date
            userGrowthData.sort((a, b) => new Date(a.month) - new Date(b.month));
            
            console.log('Real user growth data:', userGrowthData);
          } else {
            console.log('No users data in dashboard response, using sample data');
            // Create sample data based on your actual user creation dates from User.csv (only regular users)
            userGrowthData = [
              { month: 'Nov 2024', users: 1 }, // Ali (only regular user)
              { month: 'Dec 2024', users: 1 }, // Teska (only regular user)
              { month: 'Aug 2025', users: 0 }  // No regular users in Aug 2025
            ];
          }
          
          // Process real campaign data if available
          let campaignData = [];
          let reservationsData = null; // Declare at this scope level
          
          if (campaignResponse.ok) {
            try {
              const campaignResult = await campaignResponse.json();
              console.log('Processing campaign data:', campaignResult);
              if (campaignResult.success && campaignResult.data) {
                if (reservationsResponse.ok) {
                  try {
                    reservationsData = await reservationsResponse.json();
                    console.log('Processing reservations data:', reservationsData);
                  } catch (error) {
                    console.error('Error parsing reservations response:', error);
                  }
                } else {
                  console.error('Reservations API failed:', reservationsResponse.status, reservationsResponse.statusText);
                }
                campaignData = processCampaignData(campaignResult.data, reservationsData);
                console.log('Processed campaign data:', campaignData);
              } else {
                console.log('Campaign API response structure:', campaignResult);
              }
            } catch (error) {
              console.error('Error parsing campaign response:', error);
            }
          } else {
            console.error('Campaign API failed:', campaignResponse.status, campaignResponse.statusText);
          }

          // Process user profile data for demographics
          let userDemographicsData = { ageDistribution: [], genderDistribution: [] };
          if (userProfilesResponse.ok) {
            try {
              const userProfilesResult = await userProfilesResponse.json();
              console.log('Processing user profiles:', userProfilesResult);
              if (userProfilesResult.success && userProfilesResult.data) {
                userDemographicsData = processUserDemographics(userProfilesResult.data);
                console.log('Processed user demographics:', userDemographicsData);
              } else {
                console.log('User Profiles API response structure:', userProfilesResult);
                if (userProfilesResult.message) {
                  console.log('API Message:', userProfilesResult.message);
                }
              }
            } catch (error) {
              console.error('Error parsing user profiles response:', error);
            }
          } else {
            console.error('User Profiles API failed:', userProfilesResponse.status, userProfilesResponse.statusText);
            // Try to get more details about the error
            try {
              const errorText = await userProfilesResponse.text();
              console.error('Error response body:', errorText);
            } catch (e) {
              console.error('Could not read error response body');
            }
          }
          
          // Fallback to sample data if no real campaign data
          if (campaignData.length === 0) {
            console.log('No real campaign data available, using fallback sample data');
            campaignData = [
              { campaign: 'Blood Drive 1', donations: Math.floor((dashboardData.data.totalDonations || 0) * 0.3), participants: Math.floor((dashboardData.data.totalDonations || 0) * 0.5) },
              { campaign: 'Blood Drive 2', donations: Math.floor((dashboardData.data.totalDonations || 0) * 0.25), participants: Math.floor((dashboardData.data.totalDonations || 0) * 0.4) },
              { campaign: 'Emergency Appeal', donations: Math.floor((dashboardData.data.totalDonations || 0) * 0.2), participants: Math.floor((dashboardData.data.totalDonations || 0) * 0.3) },
              { campaign: 'Regular Donations', donations: Math.floor((dashboardData.data.totalDonations || 0) * 0.25), participants: Math.floor((dashboardData.data.totalDonations || 0) * 0.4) }
            ];
          }
          
          // Create blood type distribution from real reservation data or fallback
          let bloodTypeData = [];
          if (reservationsResponse.ok && reservationsData) {
            bloodTypeData = processBloodTypeFromReservations({ data: reservationsData });
          }
          
          // Fallback to dashboard data or sample data
          if (bloodTypeData.length === 0) {
            bloodTypeData = validateBloodTypeData(dashboardData.data.bloodTypeDistribution) || [
              { name: 'O+', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.38) },
              { name: 'A+', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.34) },
              { name: 'B+', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.09) },
              { name: 'AB+', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.03) },
              { name: 'O-', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.07) },
              { name: 'A-', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.06) },
              { name: 'B-', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.02) },
              { name: 'AB-', value: Math.floor((dashboardData.data.totalDonations || 0) * 0.01) }
            ];
          }
          
          setData({
            donationTrends: dashboardData.data.donationTrends || [],
            bloodTypeDistribution: bloodTypeData,
            userGrowth: userGrowthData,
            campaignPerformance: campaignData,
            bloodBankStats: dashboardData.data.bloodBankStats || [],
            monthlyComparison: dashboardData.data.monthlyComparison || [],
            userDemographics: userDemographicsData,
            users: dashboardData.data.users || []
          });
          
          // Debug the data structure
          debugData({
            donationTrends: dashboardData.data.donationTrends || [],
            bloodTypeDistribution: bloodTypeData,
            userGrowth: userGrowthData,
            campaignPerformance: campaignData,
            bloodBankStats: dashboardData.data.bloodBankStats || [],
            monthlyComparison: dashboardData.data.monthlyComparison || []
          }, dashboardData.data);
        }
      }

      
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setError('Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format = 'pdf') => {
    try {
      if (format === 'excel') {
        exportToExcel();
      } else if (format === 'pdf') {
        exportToPDF();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Create different sheets based on report type
    if (reportType === 'overview') {
      // Overview sheet
      const overviewData = [
        ['Blood Bank Analytics Overview Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Timeframe:', timeframe],
        [''],
        ['Key Metrics'],
        ['Total Donations', stats.totalDonations || 0],
        ['Total Users', stats.totalUsers || 0],
        ['Blood Banks', stats.totalBloodBanks || 0],
        ['Active Campaigns', stats.activeCampaigns || 0],
        ['Total Campaigns', stats.totalCampaigns || 0],
        [''],
        ['Blood Type Distribution']
      ];
      
      if (data.bloodTypeDistribution && data.bloodTypeDistribution.length > 0) {
        overviewData.push(['Blood Type', 'Available Units']);
        data.bloodTypeDistribution.forEach(blood => {
          overviewData.push([blood.name, blood.value]);
        });
      }
      
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
    }
    
    if (reportType === 'donations' && data.campaignPerformance) {
      // Donations sheet
      const donationsData = [
        ['Donation Performance Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Timeframe:', timeframe],
        [''],
        ['Campaign', 'Participants', 'Donations', 'Success Rate', 'Status']
      ];
      
      data.campaignPerformance.forEach(campaign => {
        donationsData.push([
          campaign.campaign,
          campaign.participants,
          campaign.donations,
          `${campaign.successRate}%`,
          campaign.isActive ? 'Active' : 'Inactive'
        ]);
      });
      
      const donationsSheet = XLSX.utils.aoa_to_sheet(donationsData);
      XLSX.utils.book_append_sheet(workbook, donationsSheet, 'Donations');
    }
    
    if (reportType === 'users' && data.userDemographics) {
      // Users sheet
      const usersData = [
        ['User Analytics Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Timeframe:', timeframe],
        [''],
        ['Total Users', stats.totalUsers || 0],
        ['Campaign Participants', data.campaignPerformance?.reduce((sum, c) => sum + c.participants, 0) || 0],
        [''],
        ['Age Distribution']
      ];
      
      if (data.userDemographics.ageDistribution) {
        usersData.push(['Age Range', 'Count']);
        data.userDemographics.ageDistribution.forEach(age => {
          usersData.push([age.name, age.value]);
        });
      }
      
      usersData.push(['', '']);
      usersData.push(['Gender Distribution']);
      
      if (data.userDemographics.genderDistribution) {
        usersData.push(['Gender', 'Count']);
        data.userDemographics.genderDistribution.forEach(gender => {
          usersData.push([gender.name, gender.value]);
        });
      }
      
      const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
      XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
    }
    
    if (reportType === 'campaigns' && data.campaignPerformance) {
      // Campaigns sheet
      const campaignsData = [
        ['Campaign Performance Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Timeframe:', timeframe],
        [''],
        ['Campaign', 'Participants', 'Donations', 'Success Rate', 'Status']
      ];
      
      data.campaignPerformance.forEach(campaign => {
        campaignsData.push([
          campaign.campaign,
          campaign.participants,
          campaign.donations,
          `${campaign.successRate}%`,
          campaign.isActive ? 'Active' : 'Inactive'
        ]);
      });
      
      const campaignsSheet = XLSX.utils.aoa_to_sheet(campaignsData);
      XLSX.utils.book_append_sheet(workbook, campaignsSheet, 'Campaigns');
    }
    
    if (reportType === 'inventory' && data.bloodTypeDistribution) {
      // Inventory sheet
      const inventoryData = [
        ['Blood Inventory Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Timeframe:', timeframe],
        [''],
        ['Blood Type', 'Available Units', 'Stock Level', 'Status', 'Priority']
      ];
      
      data.bloodTypeDistribution.forEach(blood => {
        const stockLevel = blood.value >= 10 ? 'Well Stocked' : blood.value >= 5 ? 'Moderate' : 'Low Stock';
        const status = blood.value >= 10 ? 'Safe' : blood.value >= 5 ? 'Warning' : 'Critical';
        const priority = blood.value < 5 ? 'High' : blood.value < 10 ? 'Medium' : 'Low';
        
        inventoryData.push([
          blood.name,
          blood.value,
          stockLevel,
          status,
          priority
        ]);
      });
      
      const inventorySheet = XLSX.utils.aoa_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventory');
    }
    
    // Save the file
    const fileName = `blood_bank_${reportType}_report_${timeframe}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Blood Bank ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Date and timeframe
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Timeframe: ${timeframe}`, margin, yPosition);
    yPosition += 20;
    
    // Content based on report type
    if (reportType === 'overview') {
      // Overview content
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics', margin, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const metrics = [
        ['Total Donations', stats.totalDonations || 0],
        ['Total Users', stats.totalUsers || 0],
        ['Blood Banks', stats.totalBloodBanks || 0],
        ['Active Campaigns', stats.activeCampaigns || 0],
        ['Total Campaigns', stats.totalCampaigns || 0]
      ];
      
      metrics.forEach(([label, value]) => {
        doc.text(`${label}: ${value.toLocaleString()}`, margin, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Blood type distribution table
      if (data.bloodTypeDistribution && data.bloodTypeDistribution.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Blood Type Distribution', margin, yPosition);
        yPosition += 15;
        
        const tableData = [['Blood Type', 'Available Units']];
        data.bloodTypeDistribution.forEach(blood => {
          tableData.push([blood.name, blood.value.toString()]);
        });
        
        doc.autoTable({
          startY: yPosition,
          head: [tableData[0]],
          body: tableData.slice(1),
          margin: { left: margin },
          styles: { fontSize: 10 }
        });
      }
    }
    
    if (reportType === 'donations' && data.campaignPerformance) {
      // Donations content
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Donation Performance', margin, yPosition);
      yPosition += 15;
      
      const tableData = [['Campaign', 'Participants', 'Donations', 'Success Rate', 'Status']];
      data.campaignPerformance.forEach(campaign => {
        tableData.push([
          campaign.campaign,
          campaign.participants.toString(),
          campaign.donations.toString(),
          `${campaign.successRate}%`,
          campaign.isActive ? 'Active' : 'Inactive'
        ]);
      });
      
      doc.autoTable({
        startY: yPosition,
        head: [tableData[0]],
        body: tableData.slice(1),
        margin: { left: margin },
        styles: { fontSize: 8 }
      });
    }
    
    if (reportType === 'users' && data.userDemographics) {
      // Users content
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('User Analytics', margin, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Users: ${stats.totalUsers || 0}`, margin, yPosition);
      yPosition += 10;
      
      if (data.userDemographics.ageDistribution) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Age Distribution', margin, yPosition);
        yPosition += 10;
        
        const ageData = [['Age Range', 'Count']];
        data.userDemographics.ageDistribution.forEach(age => {
          ageData.push([age.name, age.value.toString()]);
        });
        
        doc.autoTable({
          startY: yPosition,
          head: [ageData[0]],
          body: ageData.slice(1),
          margin: { left: margin },
          styles: { fontSize: 10 }
        });
      }
    }
    
    if (reportType === 'campaigns' && data.campaignPerformance) {
      // Campaigns content
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Campaign Performance', margin, yPosition);
      yPosition += 15;
      
      const tableData = [['Campaign', 'Participants', 'Donations', 'Success Rate', 'Status']];
      data.campaignPerformance.forEach(campaign => {
        tableData.push([
          campaign.campaign,
          campaign.participants.toString(),
          campaign.donations.toString(),
          `${campaign.successRate}%`,
          campaign.isActive ? 'Active' : 'Inactive'
        ]);
      });
      
      doc.autoTable({
        startY: yPosition,
        head: [tableData[0]],
        body: tableData.slice(1),
        margin: { left: margin },
        styles: { fontSize: 8 }
      });
    }
    
    if (reportType === 'inventory' && data.bloodTypeDistribution) {
      // Inventory content
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Blood Inventory Status', margin, yPosition);
      yPosition += 15;
      
      const tableData = [['Blood Type', 'Available Units', 'Stock Level', 'Status', 'Priority']];
      data.bloodTypeDistribution.forEach(blood => {
        const stockLevel = blood.value >= 10 ? 'Well Stocked' : blood.value >= 5 ? 'Moderate' : 'Low Stock';
        const status = blood.value >= 10 ? 'Safe' : blood.value >= 5 ? 'Warning' : 'Critical';
        const priority = blood.value < 5 ? 'High' : blood.value < 10 ? 'Medium' : 'Low';
        
        tableData.push([
          blood.name,
          blood.value.toString(),
          stockLevel,
          status,
          priority
        ]);
      });
      
      doc.autoTable({
        startY: yPosition,
        head: [tableData[0]],
        body: tableData.slice(1),
        margin: { left: margin },
        styles: { fontSize: 9 }
      });
    }
    
    // Save the file
    const fileName = `blood_bank_${reportType}_report_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const TimeframeSelector = () => (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
      {['week', 'month', 'year'].map((period) => (
        <button
          key={period}
          onClick={() => setTimeframe(period)}
          className={`px-4 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg
            transition-all duration-200
            ${timeframe === period 
              ? 'bg-red-600 text-white shadow-inner' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
        >
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </button>
      ))}
    </div>
  );

  const ReportTypeSelector = () => (
    <div className="flex space-x-2">
      {[
        { key: 'overview', label: 'Overview', icon: Activity },
        { key: 'donations', label: 'Donations', icon: Droplet },
        { key: 'users', label: 'Users', icon: Users },
        { key: 'campaigns', label: 'Campaigns', icon: Calendar },
        { key: 'inventory', label: 'Inventory', icon: Building2 }
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setReportType(key)}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${reportType === key 
              ? 'bg-red-600 text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
        >
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-100"></div>
            <div className="w-16 h-16 rounded-full border-t-4 border-red-600 animate-spin absolute top-0 left-0"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4 text-center max-w-md">{error}</p>
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and analytics for your blood bank operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchReportData}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            <TimeframeSelector />
          </div>
          <ReportTypeSelector />
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'overview' && (
        <div className="space-y-6">
                     {/* Key Metrics */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-600">Total Donations</p>
                   <p className="text-2xl font-bold text-gray-900">
                     {stats.totalDonations ? stats.totalDonations.toLocaleString() : '0'}
                   </p>
                 </div>
                 <div className="p-3 bg-red-100 rounded-lg">
                   <Droplet className="w-6 h-6 text-red-600" />
                 </div>
               </div>
               <div className="mt-4 flex items-center text-sm">
                 {stats.donationGrowth !== undefined ? (
                   <span className={`flex items-center ${stats.donationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     <TrendingUp className={`w-4 h-4 mr-1 ${stats.donationGrowth < 0 ? 'rotate-180' : ''}`} />
                     {stats.donationGrowth >= 0 ? '+' : ''}{stats.donationGrowth}% from last {timeframe}
                   </span>
                 ) : (
                   <span className="text-gray-500">No data available</span>
                 )}
               </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-600">Active Users</p>
                   <p className="text-2xl font-bold text-gray-900">
                     {stats.totalUsers ? stats.totalUsers.toLocaleString() : '0'}
                   </p>
                 </div>
                 <div className="p-3 bg-blue-100 rounded-lg">
                   <Users className="w-6 h-6 text-blue-600" />
                 </div>
               </div>
               <div className="mt-4 flex items-center text-sm">
                 {stats.userGrowth !== undefined ? (
                   <span className={`flex items-center ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     <TrendingUp className={`w-4 h-4 mr-1 ${stats.userGrowth < 0 ? 'rotate-180' : ''}`} />
                     {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}% from last {timeframe}
                   </span>
                 ) : (
                   <span className="text-gray-500">No data available</span>
                 )}
               </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-600">Blood Banks</p>
                   <p className="text-2xl font-bold text-gray-900">
                     {stats.totalBloodBanks ? stats.totalBloodBanks.toLocaleString() : '0'}
                   </p>
                 </div>
                 <div className="p-3 bg-green-100 rounded-lg">
                   <Building2 className="w-6 h-6 text-green-600" />
                 </div>
               </div>
               <div className="mt-4 flex items-center text-sm text-gray-500">
                 <span>Total registered blood banks</span>
               </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-600">Campaigns</p>
                   <p className="text-2xl font-bold text-gray-900">
                     {stats.activeCampaigns ? stats.activeCampaigns.toLocaleString() : '0'}
                   </p>
                 </div>
                 <div className="p-3 bg-purple-100 rounded-lg">
                   <Calendar className="w-6 h-6 text-purple-600" />
                 </div>
               </div>
               <div className="mt-4 flex items-center text-sm text-gray-500">
                 <span>Active campaigns</span>
               </div>
             </div>
           </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <h3 className="text-lg font-semibold mb-4">Donation Trends</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={data.donationTrends?.length > 0 ? data.donationTrends : generateSampleData('donationTrends')}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="month" />
                   <YAxis />
                   <Tooltip />
                   <Legend />
                   <Line type="monotone" dataKey="donations" stroke="#ef4444" strokeWidth={2} />
                 </LineChart>
               </ResponsiveContainer>
             </div>

                         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <h3 className="text-lg font-semibold mb-4">Blood Type Distribution</h3>
               <ResponsiveContainer width="100%" height={300}>
                 {data.bloodTypeDistribution && data.bloodTypeDistribution.length > 0 ? (
                   <PieChart>
                     <Pie
                       data={data.bloodTypeDistribution}
                       dataKey="value"
                       nameKey="name"
                       cx="50%"
                       cy="50%"
                       outerRadius={100}
                     >
                       {data.bloodTypeDistribution.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={BLOOD_COLORS[entry.name] || '#9ca3af'} />
                       ))}
                     </Pie>
                     <Tooltip formatter={(value) => `${value} units`} />
                     <Legend />
                   </PieChart>
                 ) : (
                   <div className="flex items-center justify-center h-full">
                     <div className="text-center">
                       <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                         <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                         </svg>
                       </div>
                       <p className="text-gray-500">No blood type data available</p>
                     </div>
                   </div>
                 )}
               </ResponsiveContainer>
             </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <h3 className="text-lg font-semibold mb-4">User Growth</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <AreaChart data={data.userGrowth?.length > 0 ? data.userGrowth : []}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="month" />
                   <YAxis />
                   <Tooltip />
                   <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>

                           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={data.campaignPerformance?.length > 0 ? data.campaignPerformance : generateSampleData('campaignPerformance')}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayName" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'donations' ? `${value} donations` : 
                        name === 'participants' ? `${value} participants` : 
                        name === 'confirmed' ? `${value} confirmed` : value,
                        name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                      labelFormatter={(label) => {
                        // Find the full campaign name for tooltip
                        const campaign = data.campaignPerformance?.find(c => c.displayName === label);
                        return campaign ? campaign.campaign : label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="donations" fill="#10b981" name="Donations" />
                    <Bar dataKey="participants" fill="#3b82f6" name="Participants" />
                    <Bar dataKey="confirmed" fill="#f59e0b" name="Confirmed" />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Campaign Details Table */}
                {data.campaignPerformance && data.campaignPerformance.length > 0 && (
                  <div className="mt">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Campaign Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 font-medium text-gray-600 w-2/5">Campaign</th>
                            <th className="text-center py-3 font-medium text-gray-600 w-1/5">Donations</th>
                            <th className="text-center py-3 font-medium text-gray-600 w-1/5">Participants</th>
                            <th className="text-center py-3 font-medium text-gray-600 w-1/5">Success Rate</th>
                            <th className="text-center py-3 font-medium text-gray-600 w-1/5">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.campaignPerformance.slice(0, 5).map((campaign, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 font-medium text-gray-900">
                                <div className="max-w-xs">
                                  <span className="text-sm leading-tight break-words">
                                    {campaign.campaign}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {campaign.donations}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {campaign.participants}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  campaign.successRate >= 70 ? 'bg-green-100 text-green-800' :
                                  campaign.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {campaign.successRate}%
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {campaign.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}

      {reportType === 'donations' && (
        <div className="space-y-6">
          {/* Donation Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Donations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalDonations ? stats.totalDonations.toLocaleString() : '0'}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Droplet className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.donationGrowth !== undefined ? (
                  <span className={`flex items-center ${stats.donationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${stats.donationGrowth < 0 ? 'rotate-180' : ''}`} />
                    {stats.donationGrowth >= 0 ? '+' : ''}{stats.donationGrowth}% from last {timeframe}
                  </span>
                ) : (
                  <span className="text-gray-500">No data available</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful Donations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.donations, 0) || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Completed blood donations</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const totalParticipants = data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.participants, 0) || 0;
                      const totalDonations = data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.donations, 0) || 0;
                      return totalParticipants > 0 ? Math.round((totalDonations / totalParticipants) * 100) : 0;
                    })()}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Donation completion rate</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeCampaigns || data.campaignPerformance?.filter(campaign => campaign.isActive).length || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Currently running campaigns</span>
              </div>
            </div>
          </div>

          {/* Donation Trends by Campaign */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Donation Trends by Campaign</h4>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={data.campaignPerformance?.slice(0, 8) || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayName" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                  dy={10}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'donations' ? `${value} donations` : 
                    name === 'participants' ? `${value} participants` : value,
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                  labelFormatter={(label) => {
                    // Find the full campaign name for tooltip
                    const campaign = data.campaignPerformance?.find(c => c.displayName === label);
                    return campaign ? campaign.campaign : label;
                  }}
                />
                <Legend />
                <Bar dataKey="donations" fill="#10b981" name="Donations" />
                <Bar dataKey="participants" fill="#3b82f6" name="Participants" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performing Campaigns */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Top Performing Campaigns</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-600 w-2/5">Campaign</th>
                    <th className="text-center py-3 font-medium text-gray-600 w-1/5">Donations</th>
                    <th className="text-center py-3 font-medium text-gray-600 w-1/5">Participants</th>
                    <th className="text-center py-3 font-medium text-gray-600 w-1/5">Success Rate</th>
                    <th className="text-center py-3 font-medium text-gray-600 w-1/5">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaignPerformance
                    ?.sort((a, b) => b.donations - a.donations)
                    .slice(0, 10)
                    .map((campaign, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">
                        <div className="max-w-xs">
                          <span className="text-sm leading-tight break-words">
                            {campaign.campaign}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {campaign.donations}
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {campaign.participants}
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.successRate >= 70 ? 'bg-green-100 text-green-800' :
                          campaign.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {campaign.successRate}%
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          index < 3 ? 'bg-yellow-100 text-yellow-800' :
                          index < 6 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {index < 3 ? 'Top 3' : index < 6 ? 'Top 10' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blood Type Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Blood Type Donation Analysis</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.bloodTypeDistribution || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {data.bloodTypeDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BLOOD_COLORS[entry.name] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} donations`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h5 className="font-medium text-gray-700">Blood Type Statistics</h5>
                {data.bloodTypeDistribution?.map((bloodType, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: BLOOD_COLORS[bloodType.name] || '#9ca3af' }}
                      />
                      <span className="font-medium text-gray-900">{bloodType.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{bloodType.value}</div>
                      <div className="text-sm text-gray-500">donations</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'users' && (
        <div className="space-y-6">
          {/* User Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.users?.filter(user => user.role === 'user').length || '0'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.userGrowth !== undefined ? (
                  <span className={`flex items-center ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${stats.userGrowth < 0 ? 'rotate-180' : ''}`} />
                    {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}% from last {timeframe}
                  </span>
                ) : (
                  <span className="text-gray-500">No data available</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Campaign Participants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.participants, 0) || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Total campaign participations</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      if (!data.users) return 0;
                      const now = new Date();
                      const timeframeMs = timeframe === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                                        timeframe === 'month' ? 30 * 24 * 60 * 60 * 1000 :
                                        timeframe === 'year' ? 365 * 24 * 60 * 60 * 1000 : 0;
                      const cutoffDate = new Date(now.getTime() - timeframeMs);
                      
                                          return data.users.filter(user => {
                      if (user.role !== 'user') return false; // Only count regular users
                      const createdAt = new Date(user.created_at);
                      return createdAt >= cutoffDate;
                    }).length;
                    })()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>New registrations this {timeframe}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Campaign Participation Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const totalUsers = data.users?.filter(user => user.role === 'user').length || 0;
                      const campaignParticipants = data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.participants, 0) || 0;
                      
                      if (totalUsers === 0) return 0;
                      
                      // Calculate unique participants (some users might join multiple campaigns)
                      const uniqueParticipants = Math.min(campaignParticipants, totalUsers);
                      return Math.round((uniqueParticipants / totalUsers) * 100);
                    })()}%
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Regular users who participated in campaigns</span>
              </div>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">User Growth Trends</h4>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart 
                data={data.userGrowth?.length > 0 ? data.userGrowth : generateSampleData('userGrowth')}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} users`, 'Users']}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* User Demographics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">User Demographics</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-4">Age Distribution</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.userDemographics?.ageDistribution?.length > 0 ? data.userDemographics.ageDistribution : [
                        { name: '18-25', value: 0, color: '#3b82f6' },
                        { name: '26-35', value: 0, color: '#10b981' },
                        { name: '36-45', value: 0, color: '#f59e0b' },
                        { name: '46+', value: 0, color: '#ef4444' }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {(data.userDemographics?.ageDistribution?.length > 0 ? data.userDemographics.ageDistribution : [
                        { name: '18-25', value: 0, color: '#3b82f6' },
                        { name: '26-35', value: 0, color: '#10b981' },
                        { name: '36-45', value: 0, color: '#f59e0b' },
                        { name: '46+', value: 0, color: '#ef4444' }
                      ]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} users`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {data.userDemographics?.ageDistribution?.length === 0 && (
                  <div className="text-center text-gray-500 mt-4">
                    <p>No age data available</p>
                    <p className="text-sm">Check console for API response details</p>
                  </div>
                )}
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-4">Gender Distribution</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.userDemographics?.genderDistribution?.length > 0 ? data.userDemographics.genderDistribution : [
                        { name: 'Male', value: 0, color: '#3b82f6' },
                        { name: 'Female', value: 0, color: '#ec4899' }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {(data.userDemographics?.genderDistribution?.length > 0 ? data.userDemographics.genderDistribution : [
                        { name: 'Male', value: 0, color: '#3b82f6' },
                        { name: 'Female', value: 0, color: '#ec4899' }
                      ]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || ['#3b82f6', '#ec4899'][index % 2]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} users`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {data.userDemographics?.genderDistribution?.length === 0 && (
                  <div className="text-center text-gray-500 mt-4">
                    <p>No gender data available</p>
                    <p className="text-sm">Check console for API response details</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Activity Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">User Activity Analysis</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.participants, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Campaign Participants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.donations, 0) || 0}
                </div>
                                 <div className="text-sm text-gray-600">Successful Donations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {(() => {
                    const totalParticipants = data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.participants, 0) || 0;
                    const totalDonations = data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.donations, 0) || 0;
                    return totalParticipants > 0 ? Math.round((totalDonations / totalParticipants) * 100) : 0;
                  })()}%
                </div>
                <div className="text-sm text-gray-600">Donation Success Rate</div>
              </div>
            </div>
          </div>

          {/* Top Active Users */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Top Active Users</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-600">User Name</th>
                    <th className="text-left py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 font-medium text-gray-600">Registration Date</th>
                    <th className="text-left py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users?.filter(user => user.role === 'user').slice(0, 10).map((user, index) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.name}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        <span className="text-sm">{user.email}</span>
                      </td>
                      <td className="py-3 text-gray-600">
                        <span className="text-sm">
                          {new Date(user.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'campaigns' && (
        <div className="space-y-6">
          {/* Campaign Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalCampaigns || data.campaigns?.length || data.campaignPerformance?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>All campaigns in system</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeCampaigns || data.campaignPerformance?.filter(campaign => campaign.isActive).length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Currently running campaigns</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.participants, 0) || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Users joined campaigns</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const totalParticipants = data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.participants, 0) || 0;
                      const totalDonations = data.campaignPerformance?.reduce((sum, campaign) => sum + campaign.donations, 0) || 0;
                      return totalParticipants > 0 ? Math.round((totalDonations / totalParticipants) * 100) : 0;
                    })()}%
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Donation completion rate</span>
              </div>
            </div>
          </div>

          {/* Campaign Performance Overview Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Campaign Performance Overview</h4>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={data.campaignPerformance?.slice(0, 8) || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayName" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                  dy={10}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'donations' ? `${value} donations` : 
                    name === 'participants' ? `${value} participants` : 
                    name === 'confirmed' ? `${value} confirmed` : value,
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                  labelFormatter={(label) => {
                    const campaign = data.campaignPerformance?.find(c => c.displayName === label);
                    return campaign ? campaign.campaign : label;
                  }}
                />
                <Legend />
                <Bar dataKey="donations" fill="#10b981" name="Donations" />
                <Bar dataKey="participants" fill="#3b82f6" name="Participants" />
                <Bar dataKey="confirmed" fill="#f59e0b" name="Confirmed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Campaign Success Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Campaign Success Analysis</h4>
            
            {!data.campaignPerformance || data.campaignPerformance.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg font-medium mb-2">No Campaign Data Available</p>
                <p className="text-sm">Campaign performance data will appear here once campaigns are created and have participants.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-4">Success Rate Distribution</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const successRates = {
                            'High (70%+)': 0,
                            'Medium (40-69%)': 0,
                            'Low (0-39%)': 0
                          };
                          
                          data.campaignPerformance.forEach(campaign => {
                            if (campaign.successRate >= 70) successRates['High (70%+)']++;
                            else if (campaign.successRate >= 40) successRates['Medium (40-69%)']++;
                            else successRates['Low (0-39%)']++;
                          });
                          
                          return Object.entries(successRates).map(([range, count]) => ({
                            name: range,
                            value: count,
                            color: range.includes('High') ? '#10b981' : 
                                   range.includes('Medium') ? '#f59e0b' : '#ef4444'
                          })).filter(item => item.value > 0);
                        })()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                      >
                        {(() => {
                          const successRates = {
                            'High (70%+)': 0,
                            'Medium (40-69%)': 0,
                            'Low (0-39%)': 0
                          };
                          
                          data.campaignPerformance.forEach(campaign => {
                            if (campaign.successRate >= 70) successRates['High (70%+)']++;
                            else if (campaign.successRate >= 40) successRates['Medium (40-69%)']++;
                            else successRates['Low (0-39%)']++;
                          });
                          
                          return Object.entries(successRates).map(([range, count]) => ({
                            name: range,
                            value: count,
                            color: range.includes('High') ? '#10b981' : 
                                   range.includes('Medium') ? '#f59e0b' : '#ef4444'
                          })).filter(item => item.value > 0);
                        })().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} campaigns`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {(() => {
                    const successRates = {
                      'High (70%+)': 0,
                      'Medium (40-69%)': 0,
                      'Low (0-39%)': 0
                    };
                    
                    data.campaignPerformance.forEach(campaign => {
                      if (campaign.successRate >= 70) successRates['High (70%+)']++;
                      else if (campaign.successRate >= 40) successRates['Medium (40-69%)']++;
                      else successRates['Low (0-39%)']++;
                    });
                    
                    const total = Object.values(successRates).reduce((sum, count) => sum + count, 0);
                    return total === 0 ? (
                      <div className="text-center text-gray-500 mt-4">
                        <p>No success rate data available</p>
                      </div>
                    ) : null;
                  })()}
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-4">Campaign Status Distribution</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const statusCounts = {
                            'Active': 0,
                            'Inactive': 0
                          };
                          
                          data.campaignPerformance.forEach(campaign => {
                            if (campaign.isActive) statusCounts['Active']++;
                            else statusCounts['Inactive']++;
                          });
                          
                          return Object.entries(statusCounts).map(([status, count]) => ({
                            name: status,
                            value: count,
                            color: status === 'Active' ? '#10b981' : '#6b7280'
                          })).filter(item => item.value > 0);
                        })()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                      >
                        {(() => {
                          const statusCounts = {
                            'Active': 0,
                            'Inactive': 0
                          };
                          
                          data.campaignPerformance.forEach(campaign => {
                            if (campaign.isActive) statusCounts['Active']++;
                            else statusCounts['Inactive']++;
                          });
                          
                          return Object.entries(statusCounts).map(([status, count]) => ({
                            name: status,
                            value: count,
                            color: status === 'Active' ? '#10b981' : '#6b7280'
                          })).filter(item => item.value > 0);
                        })().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} campaigns`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {(() => {
                    const statusCounts = {
                      'Active': 0,
                      'Inactive': 0
                    };
                    
                    data.campaignPerformance.forEach(campaign => {
                      if (campaign.isActive) statusCounts['Active']++;
                      else statusCounts['Inactive']++;
                    });
                    
                    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
                    return total === 0 ? (
                      <div className="text-center text-gray-500 mt-4">
                        <p>No status data available</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Campaign Performance Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Detailed Campaign Performance</h4>
            
            {!data.campaignPerformance || data.campaignPerformance.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg font-medium mb-2">No Campaign Performance Data</p>
                <p className="text-sm">Detailed campaign performance will appear here once campaigns have data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600 w-2/5">Campaign</th>
                      <th className="text-center py-3 font-medium text-gray-600 w-1/5">Participants</th>
                      <th className="text-center py-3 font-medium text-gray-600 w-1/5">Donations</th>
                      <th className="text-center py-3 font-medium text-gray-600 w-1/5">Success Rate</th>
                      <th className="text-center py-3 font-medium text-gray-600 w-1/5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaignPerformance.sort((a, b) => b.successRate - a.successRate).map((campaign, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">
                          <div className="max-w-xs">
                            <span className="text-sm leading-tight break-words">
                              {campaign.campaign}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {campaign.participants}
                          </span>
                        </td>
                        <td className="text-center py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {campaign.donations}
                          </span>
                        </td>
                        <td className="text-center py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.successRate >= 70 ? 'bg-green-100 text-green-800' :
                            campaign.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {campaign.successRate}%
                          </span>
                        </td>
                        <td className="text-center py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Campaign Insights */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Campaign Insights</h4>
            
            {!data.campaignPerformance || data.campaignPerformance.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">💡</div>
                <p className="text-lg font-medium mb-2">No Campaign Insights Available</p>
                <p className="text-sm">Campaign insights will appear here once campaigns have performance data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {data.campaignPerformance.filter(campaign => campaign.successRate >= 70).length}
                  </div>
                  <div className="text-sm text-gray-600">High Success Campaigns</div>
                  <div className="text-xs text-gray-500 mt-1">70%+ success rate</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    {data.campaignPerformance.filter(campaign => campaign.successRate >= 40 && campaign.successRate < 70).length}
                  </div>
                  <div className="text-sm text-gray-600">Medium Success Campaigns</div>
                  <div className="text-xs text-gray-500 mt-1">40-69% success rate</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    {data.campaignPerformance.filter(campaign => campaign.successRate < 40).length}
                  </div>
                  <div className="text-sm text-gray-600">Low Success Campaigns</div>
                  <div className="text-xs text-gray-500 mt-1">Below 40% success rate</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">Inventory Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {data.bloodTypeDistribution?.reduce((total, blood) => total + blood.value, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Units</div>
                <div className="text-xs text-gray-500 mt-1">All blood types</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {data.bloodTypeDistribution?.filter(blood => blood.value > 10).length || 0}
                </div>
                <div className="text-sm text-gray-600">Well Stocked</div>
                <div className="text-xs text-gray-500 mt-1">10+ units available</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {data.bloodTypeDistribution?.filter(blood => blood.value >= 5 && blood.value <= 10).length || 0}
                </div>
                <div className="text-sm text-gray-600">Moderate Stock</div>
                <div className="text-xs text-gray-500 mt-1">5-10 units available</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {data.bloodTypeDistribution?.filter(blood => blood.value < 5).length || 0}
                </div>
                <div className="text-sm text-gray-600">Low Stock</div>
                <div className="text-xs text-gray-500 mt-1">Below 5 units</div>
              </div>
            </div>
          </div>

          {/* Blood Type Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Blood Type Distribution</h4>
            {data.bloodTypeDistribution && data.bloodTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={data.bloodTypeDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} units`, 'Available Units']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  >
                    {data.bloodTypeDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.value >= 10 ? '#10b981' : 
                          entry.value >= 5 ? '#f59e0b' : 
                          '#ef4444'
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🩸</div>
                <p className="text-lg font-medium mb-2">No Blood Inventory Data</p>
                <p className="text-sm">Blood inventory data will appear here once available.</p>
              </div>
            )}
          </div>

          {/* Blood Type Details Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Blood Type Details</h4>
            {data.bloodTypeDistribution && data.bloodTypeDistribution.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600">Blood Type</th>
                      <th className="text-center py-3 font-medium text-gray-600">Available Units</th>
                      <th className="text-center py-3 font-medium text-gray-600">Stock Level</th>
                      <th className="text-center py-3 font-medium text-gray-600">Status</th>
                      <th className="text-center py-3 font-medium text-gray-600">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bloodTypeDistribution
                      .sort((a, b) => b.value - a.value)
                      .map((bloodType, index) => {
                        const stockLevel = 
                          bloodType.value >= 10 ? 'Well Stocked' :
                          bloodType.value >= 5 ? 'Moderate' :
                          'Low Stock';
                        
                        const status = 
                          bloodType.value >= 10 ? 'Safe' :
                          bloodType.value >= 5 ? 'Warning' :
                          'Critical';
                        
                        const priority = 
                          bloodType.value < 5 ? 'High' :
                          bloodType.value < 10 ? 'Medium' :
                          'Low';
                        
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 font-medium text-gray-900">
                              <span className="text-lg font-bold">{bloodType.name}</span>
                            </td>
                            <td className="text-center py-3">
                              <span className="text-2xl font-bold text-blue-600">
                                {bloodType.value}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">units</span>
                            </td>
                            <td className="text-center py-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                bloodType.value >= 10 ? 'bg-green-100 text-green-800' :
                                bloodType.value >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {stockLevel}
                              </span>
                            </td>
                            <td className="text-center py-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                bloodType.value >= 10 ? 'bg-green-100 text-green-800' :
                                bloodType.value >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="text-center py-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                bloodType.value < 5 ? 'bg-red-100 text-red-800' :
                                bloodType.value < 10 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {priority}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg font-medium mb-2">No Blood Type Details</p>
                <p className="text-sm">Detailed blood type information will appear here once available.</p>
              </div>
            )}
          </div>

          {/* Stock Level Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Stock Level Analysis</h4>
            {data.bloodTypeDistribution && data.bloodTypeDistribution.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-4xl mb-4">🟢</div>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {data.bloodTypeDistribution.filter(blood => blood.value >= 10).length}
                  </div>
                  <div className="text-lg font-medium text-green-700 mb-2">Safe Stock Levels</div>
                  <div className="text-sm text-green-600">
                    {data.bloodTypeDistribution
                      .filter(blood => blood.value >= 10)
                      .map(blood => blood.name)
                      .join(', ') || 'None'}
                  </div>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-4xl mb-4">🟡</div>
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    {data.bloodTypeDistribution.filter(blood => blood.value >= 5 && blood.value < 10).length}
                  </div>
                  <div className="text-lg font-medium text-yellow-700 mb-2">Warning Stock Levels</div>
                  <div className="text-sm text-yellow-600">
                    {data.bloodTypeDistribution
                      .filter(blood => blood.value >= 5 && blood.value < 10)
                      .map(blood => blood.name)
                      .join(', ') || 'None'}
                  </div>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-4xl mb-4">🔴</div>
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    {data.bloodTypeDistribution.filter(blood => blood.value < 5).length}
                  </div>
                  <div className="text-lg font-medium text-red-700 mb-2">Critical Stock Levels</div>
                  <div className="text-sm text-red-600">
                    {data.bloodTypeDistribution
                      .filter(blood => blood.value < 5)
                      .map(blood => blood.name)
                      .join(', ') || 'None'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-lg font-medium mb-2">No Stock Analysis Available</p>
                <p className="text-sm">Stock level analysis will appear here once inventory data is available.</p>
              </div>
            )}
          </div>

          {/* Inventory Recommendations */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold mb-4">Inventory Recommendations</h4>
            {data.bloodTypeDistribution && data.bloodTypeDistribution.length > 0 ? (
              <div className="space-y-4">
                {data.bloodTypeDistribution
                  .filter(blood => blood.value < 10)
                  .sort((a, b) => a.value - b.value)
                  .map((bloodType, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      bloodType.value < 5 ? 'bg-red-50 border-red-400' :
                      'bg-yellow-50 border-yellow-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className={`font-medium ${
                            bloodType.value < 5 ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {bloodType.name} Blood Type
                          </h5>
                          <p className={`text-sm ${
                            bloodType.value < 5 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            Current stock: {bloodType.value} units
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            bloodType.value < 5 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {bloodType.value < 5 ? 'URGENT' : 'NEEDS ATTENTION'}
                          </div>
                          <div className={`text-sm ${
                            bloodType.value < 5 ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                            {bloodType.value < 5 ? 'Critical level' : 'Low stock'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {data.bloodTypeDistribution.filter(blood => blood.value < 10).length === 0 && (
                  <div className="text-center text-green-600 py-8">
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-lg font-medium mb-2">All Blood Types Well Stocked</p>
                    <p className="text-sm">No immediate action required. All blood types have adequate inventory levels.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">💡</div>
                <p className="text-lg font-medium mb-2">No Recommendations Available</p>
                <p className="text-sm">Inventory recommendations will appear here once data is available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Reports;
