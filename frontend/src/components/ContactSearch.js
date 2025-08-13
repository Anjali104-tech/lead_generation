import React, { useState } from "react";
import axios from "axios";

// Simple icon components to avoid import issues
const SearchIcon = () => <span className="text-lg">🔍</span>;
const DownloadIcon = () => <span className="text-lg">📥</span>;
const LinkedInIcon = () => <span className="text-lg">💼</span>;
const BusinessIcon = () => <span className="text-lg">🏢</span>;
const PersonIcon = () => <span className="text-lg">👤</span>;
const WorkIcon = () => <span className="text-lg">💼</span>;
const ScheduleIcon = () => <span className="text-lg">⏰</span>;

// Helper function to calculate years of experience
const calculateExperience = (profile) => {
  if (!profile.employer || profile.employer.length === 0) {
    return "N/A";
  }

  let earliestStartDate = null;

  profile.employer.forEach((job) => {
    if (job.start_date) {
      const startDate = new Date(job.start_date);
      if (!earliestStartDate || startDate < earliestStartDate) {
        earliestStartDate = startDate;
      }
    }
  });

  if (!earliestStartDate) {
    return "N/A";
  }

  const now = new Date();
  const yearsExp = Math.floor(
    (now - earliestStartDate) / (1000 * 60 * 60 * 24 * 365)
  );
  return yearsExp > 0 ? `${yearsExp} years` : "< 1 year";
};

const ContactSearch = ({ selectedCompanies, jobTitles, parsedFilters }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setPageLoading(true);
    fetchContacts(newPage);
  };

  const fetchContacts = async (pageNum = 1) => {
    if (!selectedCompanies || selectedCompanies.length === 0) {
      setError("Please select at least one company");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const job_title_values = jobTitles?.length > 0 ? jobTitles : undefined;

      // Build people filters from parsedFilters
      const peopleFilters = [];

      // Add CURRENT_COMPANY filter
      if (parsedFilters?.CURRENT_COMPANY?.length > 0) {
        peopleFilters.push({
          filter_type: "CURRENT_COMPANY",
          type: "in",
          value: parsedFilters.CURRENT_COMPANY
        });
      }

      // Add YEARS_OF_EXPERIENCE filter
      if (parsedFilters?.YEARS_OF_EXPERIENCE?.length > 0) {
        const validValues = parsedFilters.YEARS_OF_EXPERIENCE.filter(value =>
          ["Less than 1 year", "1 to 2 years", "3 to 5 years", "6 to 10 years", "More than 10 years"].includes(value)
        );
        if (validValues.length > 0) {
          peopleFilters.push({
            filter_type: "YEARS_OF_EXPERIENCE",
            type: "in",
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_OF_EXPERIENCE values:', parsedFilters.YEARS_OF_EXPERIENCE);
        }
      }

      // Add YEARS_AT_CURRENT_COMPANY filter
      if (parsedFilters?.YEARS_AT_CURRENT_COMPANY?.length > 0) {
        const validValues = parsedFilters.YEARS_AT_CURRENT_COMPANY.filter(value =>
          ["Less than 1 year", "1 to 2 years", "3 to 5 years", "6 to 10 years", "More than 10 years"].includes(value)
        );
        if (validValues.length > 0) {
          peopleFilters.push({
            filter_type: "YEARS_AT_CURRENT_COMPANY",
            type: "in",
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_AT_CURRENT_COMPANY values:', parsedFilters.YEARS_AT_CURRENT_COMPANY);
        }
      }

      // Add YEARS_IN_CURRENT_POSITION filter
      if (parsedFilters?.YEARS_IN_CURRENT_POSITION?.length > 0) {
        const validValues = parsedFilters.YEARS_IN_CURRENT_POSITION.filter(value =>
          ["Less than 1 year", "1 to 2 years", "3 to 5 years", "6 to 10 years", "More than 10 years"].includes(value)
        );
        if (validValues.length > 0) {
          peopleFilters.push({
            filter_type: "YEARS_IN_CURRENT_POSITION",
            type: "in",
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_IN_CURRENT_POSITION values:', parsedFilters.YEARS_IN_CURRENT_POSITION);
        }
      }

      // Add SENIORITY_LEVEL filter
      if (parsedFilters?.SENIORITY_LEVEL?.length > 0) {
        const validValues = parsedFilters.SENIORITY_LEVEL.filter(value =>
          ["Owner / Partner", "CXO", "Vice President", "Director", "Experienced Manager", "Entry Level Manager", "Strategic", "Senior", "Entry Level", "In Training"].includes(value)
        );
        if (validValues.length > 0) {
          peopleFilters.push({
            filter_type: "SENIORITY_LEVEL",
            type: "in",
            value: validValues
          });
        } else {
          console.warn('Invalid SENIORITY_LEVEL values:', parsedFilters.SENIORITY_LEVEL);
        }
      }

      // Add boolean filters
      if (parsedFilters?.RECENTLY_CHANGED_JOBS === true) {
        peopleFilters.push({
          filter_type: "RECENTLY_CHANGED_JOBS"
        });
      }

      if (parsedFilters?.POSTED_ON_LINKEDIN === true) {
        peopleFilters.push({
          filter_type: "POSTED_ON_LINKEDIN"
        });
      }

      if (parsedFilters?.IN_THE_NEWS === true) {
        peopleFilters.push({
          filter_type: "IN_THE_NEWS"
        });
      }

      console.log("Sending contact search request:", {
        companies: selectedCompanies,
        job_titles: job_title_values,
        people_filters: peopleFilters,
        page: pageNum,
      });

      const response = await axios.post(
        "http://localhost:5000/api/find-contacts",
        {
          companies: selectedCompanies,
          job_titles: job_title_values,
          people_filters: peopleFilters,
          page: pageNum,
        }
      );

      console.log("Contact API response:", response.data);

      if (response.data && response.data.profiles) {
        setContacts(response.data.profiles);
        setTotalCount(response.data.total_count || 0);
        setTotalPages(response.data.total_pages || 1);

        if (pageNum > 1 && response.data.profiles.length === 0) {
          // If we requested a page but got no results, go back to page 1
          setPage(1);
          setError("No more contacts available. Returning to first page.");
          fetchContacts(1);
          return;
        }
      } else {
        setContacts([]);
        setError("No contact data found in the response");
      }

      if (response.data?.profiles?.length === 0 && pageNum === 1) {
        setError("No contacts found for the selected companies and job titles");
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.error || "Failed to fetch contacts");
      setContacts([]);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const exportContacts = async () => {
    if (contacts.length === 0) return;

    setExportLoading(true);

    try {
      const headers = [
        "Name",
        "Title",
        "Company",
        "Experience (Years)",
        "LinkedIn URL",
      ];
      const rows = contacts.map((profile) => {
        const companyName =
          profile.employer && profile.employer.length > 0
            ? profile.employer[0].company_name
            : profile.company_name || "";

        const yearsOfExperience = calculateExperience(profile);

        const title =
          profile.headline ||
          profile.default_position_title ||
          profile.current_title ||
          "";

        const linkedInUrl =
          profile.linkedin_profile_url || profile.flagship_profile_url || "";

        return [
          profile.name || "",
          title,
          companyName,
          yearsOfExperience,
          linkedInUrl,
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "contacts_export.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting contacts:", error);
      setError("Failed to export contacts");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="card mt-8 bg-gray-50 border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Contact Search
        </h3>
        <button
          onClick={() => fetchContacts(1)}
          disabled={
            loading || !selectedCompanies || selectedCompanies.length === 0
          }
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SearchIcon />
          <span className="ml-2">Find Contacts</span>
        </button>
      </div>

      {jobTitles && jobTitles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          Searching for job titles: {jobTitles.join(", ")}
        </div>
      )}

      {selectedCompanies && selectedCompanies.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-gray-700">
            Selected companies: {selectedCompanies.length}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center my-8 p-8 bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>

          <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">
            🔍 Searching for Contacts
          </h4>

          <p className="text-gray-600 text-center max-w-md leading-relaxed">
            Scanning {selectedCompanies?.length || 0} selected companies for
            matching professionals...
          </p>

          <div className="flex gap-2 mt-4">
            <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {contacts.length > 0 && (
        <>
          <hr className="my-6 border-gray-200" />

          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900">
              Found {totalCount} Contacts (Page {page} of {totalPages})
            </h4>

            <button
              onClick={exportContacts}
              disabled={exportLoading}
              className="btn-primary text-sm px-4 py-2"
            >
              {exportLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </div>
              ) : (
                <>
                  <DownloadIcon />
                  <span className="ml-2">Export CSV</span>
                </>
              )}
            </button>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {pageLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-blue-600 font-medium">Loading Page {page}...</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-1/5">
                      <div className="flex items-center">
                        <PersonIcon />
                        <span className="ml-2">Name</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-1/4">
                      <div className="flex items-center">
                        <WorkIcon />
                        <span className="ml-2">Title</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-3/10">
                      <div className="flex items-center">
                        <BusinessIcon />
                        <span className="ml-2">Company</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-1/6">
                      <div className="flex items-center">
                        <ScheduleIcon />
                        <span className="ml-2">Experience</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-1/10">
                      <div className="flex items-center">
                        <LinkedInIcon />
                        <span className="ml-2">Profile</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((profile, index) => {
                    const companyName =
                      profile.employer && profile.employer.length > 0
                        ? profile.employer[0].company_name
                        : profile.company_name || "N/A";

                    const yearsOfExperience = calculateExperience(profile);
                    const profileTitle =
                      profile.headline ||
                      profile.default_position_title ||
                      profile.current_title ||
                      "N/A";

                    return (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                              {profile.name
                                ? profile.name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <p className="font-medium text-gray-900">
                              {profile.name || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-600 font-medium leading-relaxed">
                            {profileTitle}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-600 font-medium">
                            {companyName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm font-medium">
                            {yearsOfExperience}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {profile.linkedin_profile_url ? (
                            <a
                              href={profile.linkedin_profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                              title="View LinkedIn Profile"
                            >
                              <LinkedInIcon />
                            </a>
                          ) : profile.flagship_profile_url ? (
                            <a
                              href={profile.flagship_profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                              title="View Profile"
                            >
                              <PersonIcon />
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalCount > 20 && (
            <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Last
                  </button>
                </div>
              </div>
              <p className="text-center text-gray-600 mt-2 font-medium">
                Showing 20 contacts per page, {totalCount.toLocaleString()} contacts total
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContactSearch;
