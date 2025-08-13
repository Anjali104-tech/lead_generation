import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Grid,
} from "@mui/material";

const CompanyList = ({ companies, loading, error, onCompanySelection }) => {
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Toggle company selection
  const handleToggle = (company) => () => {
    const currentIndex = selectedCompanies.findIndex(
      (c) => c.company_id === company.company_id
    );
    const newSelected = [...selectedCompanies];

    if (currentIndex === -1) {
      newSelected.push(company);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setSelectedCompanies(newSelected);

    // If there's a callback for selection, call it
    if (onCompanySelection) {
      onCompanySelection(newSelected);
    }
  };

  // Check if a company is selected
  const isSelected = (id) => {
    return (
      selectedCompanies.findIndex(
        (c) => c.company_id === id || c.id === id || c._id === id
      ) !== -1
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography color="text.secondary">
          No companies found. Try adjusting your search filters.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Companies ({companies.length})</Typography>
        <Typography variant="subtitle1">
          Selected: {selectedCompanies.length}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List sx={{ width: "100%" }}>
        {companies.map((company) => {
          // Use available ID field (different APIs might use different field names)
          const companyId = company.id || company._id || company.company_id;
          const labelId = `company-list-label-${companyId}`;
          const isItemSelected = isSelected(companyId);

          return (
            <ListItem
              key={companyId}
              onClick={handleToggle(company)}
              dense
              button
              selected={isItemSelected}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                },
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                },
                mb: 1,
                p: 2,
                borderRadius: 1,
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={isItemSelected}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-labelledby": labelId }}
                  color="primary"
                />
              </ListItemIcon>

              <ListItemText
                id={labelId}
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    {company.name || company.company_name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Grid container spacing={1}>
                      {(company.industry || company.industries) && (
                        <Grid item>
                          <Chip
                            label={company.industry || company.industries}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Grid>
                      )}

                      {/* Show location if available */}
                      {company.location && (
                        <Grid item>
                          <Chip
                            label={company.location}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Grid>
                      )}

                      {/* Show keywords/tags if available */}
                      {company.keywords &&
                        company.keywords.map((keyword, index) => (
                          <Grid item key={index}>
                            <Chip
                              label={keyword}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </Grid>
                        ))}

                      {/* Fallback to tags if keywords aren't available */}
                      {!company.keywords &&
                        company.tags &&
                        company.tags.map((tag, index) => (
                          <Grid item key={index}>
                            <Chip
                              label={tag}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>

      {selectedCompanies.length > 0 && (
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              onCompanySelection && onCompanySelection(selectedCompanies, true)
            }
          >
            Use Selected Companies ({selectedCompanies.length})
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default CompanyList;
