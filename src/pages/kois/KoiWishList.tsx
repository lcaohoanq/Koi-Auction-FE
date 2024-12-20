import { Typography } from "@mui/material";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import KoiBreederViewGrid from "~/components/search/KoiBreederViewGrid";
import LoadingComponent from "~/components/shared/LoadingComponent";
import { DYNAMIC_API_URL } from "~/constants/endPoints";
import { useAuth } from "~/contexts/AuthContext";
import { KoiDetailModel } from "~/types/kois.type";
import { KoisResponse } from "~/types/paginated.types";
import { getCookie } from "~/utils/cookieUtils";

const KoiWishList: React.FC = () => {
  const userId = getCookie("user_id");
  const accessToken = getCookie("access_token");
  const [kois, setKois] = useState<KoiDetailModel[]>([]);
  const [totalKoi, setTotalKoi] = useState(0); // State to hold total koi count
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true); // To track if more pages are available
  const itemsPerPage = 16; // Number of koi per page
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const handleSearchStateChange = (isActive: boolean) => {
    setIsSearchActive(isActive);
  };

  const handleView = (id: number) => {
    navigate(`/kois/${id}`);
  };

  // if(isLoading){
  //   return (
  //     <LoadingComponent/>
  //   )
  // }

  const fetchKoiData = useCallback(async () => {
    if (!accessToken) {
      setError("No access token available");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get<KoisResponse>(
        `${DYNAMIC_API_URL}/breeders/kois/status`,
        {
          params: {
            breeder_id: userId,
            status: "UNVERIFIED",
            page: currentPage - 1,
            limit: itemsPerPage,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = response.data; // Access the data property of the response

      if (data) {
        setKois(data.item);
        setTotalKoi(data.total_item);
        setHasMorePages(data.total_page > currentPage);
      }
    } catch (error) {
      console.error("Cannot fetch Koi data:", error);
      setError("Failed to fetch your verify Koi data");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage, itemsPerPage]);

  useEffect(() => {
    if (isLoggedIn && userId && accessToken) {
      fetchKoiData();
    }
  }, [isLoggedIn, userId, accessToken, fetchKoiData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingComponent />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number,
  ) => {
    setCurrentPage(page); // Update the current page when pagination changes
  };

  return (
    <div>
      {kois.length > 0 && userId ? (
        <div className="ml-16 mr-16 mb-16">
          <Typography variant="h4" className="text-center">
            Your Kois is waiting to Verified
          </Typography>
          <Typography
            variant="body1"
            className="text-center text-gray-500"
            sx={{ marginTop: "15px" }}
          >
            *Note: Please wait until your koi is verified by our team. We will
            send result email back, thanks for your patience. From Koi Auction
            Team.
          </Typography>
          <Typography variant="body2" className="text-left">
            Showing 1 - {kois.length} of {totalKoi} results.
          </Typography>
          <KoiBreederViewGrid kois={kois} handleView={handleView} />
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-[30rem]">
          <Typography
            variant="h3"
            sx={{
              color: "error.main",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Koi's Unverified Not Available
          </Typography>
        </div>
      )}
    </div>
  );
};

export default KoiWishList;
