import { Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { AuctionModel } from "~/types/auctions.type";
import AuctionSearchComponent from "../search/AuctionSearchComponent";
import LoadingComponent from "./LoadingComponent";
import { ERROR_MESSAGE } from "~/constants/message";

interface AuctionListProps {
  fetchAuctionsData: (
    page: number,
    itemsPerPage: number,
  ) => Promise<AuctionModel[]>;
  cartComponent: React.FC<{ items: AuctionModel[] }>;
  emptyMessage: string;
  itemsPerPage?: number;
}

const AuctionList: React.FC<AuctionListProps> = ({
  fetchAuctionsData,
  cartComponent: CartComponent,
  emptyMessage,
  itemsPerPage = 18,
}) => {
  const [auctions, setAuctions] = useState<AuctionModel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    const loadAuctions = async () => {
      if (isSearchActive) return; // Skip loading auctions if there's an active search

      setIsLoading(true);
      setError(null);

      try {
        const fetchedAuctions = await fetchAuctionsData(
          currentPage - 1,
          itemsPerPage,
        );
        setAuctions(fetchedAuctions);
        setHasMorePages(fetchedAuctions.length === itemsPerPage);
      } catch (error) {
        console.error(ERROR_MESSAGE.FAILED_TO_FETCH_AUCTIONS, error);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuctions();
  }, [currentPage, fetchAuctionsData, itemsPerPage, isSearchActive]);

  const handleSearchStateChange = (isActive: boolean) => {
    setIsSearchActive(isActive);
  };

  if (isLoading && !isSearchActive) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingComponent />
      </div>
    );
  }

  if (error && !isSearchActive) {
    return (
      <Typography
        variant="h5"
        sx={{
          marginTop: "10rem",
          marginBottom: "10rem",
          color: "error.main",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {error}
      </Typography>
    );
  }

  return (
    <div className="container mx-auto">
      {!isSearchActive && (
        <>
          {auctions.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-[30rem]">
              <Typography
                variant="h3"
                sx={{
                  color: "error.main",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {emptyMessage}
              </Typography>
            </div>
          ) : (
            <>
              <AuctionSearchComponent
                onSearchStateChange={handleSearchStateChange}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AuctionList;
