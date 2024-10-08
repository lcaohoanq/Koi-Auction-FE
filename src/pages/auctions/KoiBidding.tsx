import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getKoiById,
  fetchAuctionKoiDetails,
  fetchAuctionById,
} from "~/utils/apiUtils";
import { useAuth } from "~/contexts/AuthContext";
import { KoiDetailModel } from "../kois/Kois";
import { Bid } from "~/components/BiddingHistory";
import BiddingHistory from "../../components/BiddingHistory";
import NavigateButton from "../../components/shared/NavigateButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFish,
  faRuler,
  faCalendarDays,
  faVenusMars,
  faDollarSign,
  faGavel,
  faArrowLeft,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";
import {
  placeBid,
  subscribeToAuctionUpdates,
  unsubscribeFromAuctionUpdates,
} from "~/utils/websocket";
import { connectWebSocket, disconnectWebSocket } from "~/utils/websocket";
import { Auction } from "./Auctions";
import { AuctionKoi } from "./AuctionDetail";
import { toast } from "react-toastify";
import Sold from "../../assets/Sold.png";

// Define the KoiDetail UI component
interface KoiDetailItemProps {
  icon: IconDefinition;
  label: string;
  value: string | number;
  fontSize?: string;
  bgColor?: string;
  textColor?: string;
}

// Define the BidRequest interface
export interface BidRequest {
  auction_koi_id: number; // The ID of the auction koi
  bid_amount: number; // The amount of the bid
  bidder_token: string;
}

// Define the KoiDetailItem component, the UI for the koi details
const KoiDetailItem: React.FC<KoiDetailItemProps> = ({
  icon,
  label,
  value,
  fontSize = "text-2xl",
  bgColor = "bg-gray-100",
  textColor = "text-black",
}) => {
  return (
    <div
      className={`${bgColor} m-2 grid grid-cols-2 rounded-3xl border border-gray-300 p-3`}
    >
      <div className="flex items-center">
        <FontAwesomeIcon icon={icon as IconDefinition} color="#d66b56" />
        <p className={`ml-2 text-lg`}>{label}</p>
      </div>
      <p className={`${fontSize} text-end ${textColor}`}>{value}</p>
    </div>
  );
};

const KoiBidding: React.FC = () => {
  const { auctionId, auctionKoiId } = useParams<{
    auctionId: string;
    auctionKoiId: string;
  }>();
  const { isLoggedIn, user } = useAuth(); // Get the user and login status from the auth context
  const [koi, setKoi] = useState<KoiDetailModel | null>(null); // State for koi details
  const [bidAmount, setBidAmount] = useState<number>(0); // State for bid amount
  const [auctionKoi, setAuctionKoi] = useState<AuctionKoi | null>(null); // State for auction koi details
  const [auction, setAuction] = useState<Auction | null>(null); // State for auction details
  const [latestBid, setLatestBid] = useState<Bid | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  const isAuctionOngoing = () => {
    // Function to check if the auction is ongoing
    if (!auction) return false;
    const now = new Date();
    //time and date of auction checked later
    return auction.status === "ACTIVE";
  };

  const [isConnected, setIsConnected] = useState(false); // State for connection status

  useEffect(() => {
    const loadKoiAndBids = async () => {
      try {
        const [auctionKoiDetails, auctionDetails] = await Promise.all([
          fetchAuctionKoiDetails(Number(auctionId), Number(auctionKoiId)),
          fetchAuctionById(Number(auctionId)),
        ]);

        setAuctionKoi(auctionKoiDetails);
        setAuction(auctionDetails);
        setBidAmount(
          auctionKoiDetails.current_bid +
            auctionKoiDetails.bid_step +
            (auctionKoiDetails.current_bid == 0
              ? auctionKoiDetails.base_price
              : 0),
        );

        const loadKoi = async () => {
          const koiDetails = await getKoiById(auctionKoiDetails.koi_id);
          setKoi(koiDetails);
        };
        loadKoi();
      } catch (error) {
        console.error("Error loading koi and bids:", error);
      }
    };

    loadKoiAndBids();
  }, [auctionId, auctionKoiId]);

  useEffect(() => {
    console.log("Current auction state:", auction);
    let unsubscribe: (() => void) | undefined;

    const handleBeforeUnload = () => {
      if (unsubscribe) unsubscribe();
      disconnectWebSocket();
    };

    if (isAuctionOngoing()) {
      connectWebSocket(() => {
        setIsConnected(true);
        if (auctionKoiId) {
          unsubscribe = subscribeToAuctionUpdates(
            Number(auctionKoiId),
            (bidResponse) => {
              if (
                !auctionKoi ||
                bidResponse.bid_amount > auctionKoi.current_bid
              ) {
                toast.success("New highest bid received!");
              }
              setLatestBid(bidResponse);
              setAuctionKoi((prevAuctionKoi) => {
                if (prevAuctionKoi) {
                  return {
                    ...prevAuctionKoi,
                    current_bid: bidResponse.bid_amount,
                  };
                }
                return prevAuctionKoi;
              });
              setBidAmount(bidResponse.bid_amount + auctionKoi?.bid_step || 0);
            },
          );
        }
      });

      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      disconnectWebSocket();
      setIsConnected(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      disconnectWebSocket();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [auction, auctionKoiId, auctionKoi]);

  const handlePlaceBid = () => {
    if (!isConnected || !user || !auctionKoi) {
      toast("Login Before Place Bid!");
      return;
    }
    const bidRequest: BidRequest = {
      auction_koi_id: auctionKoi.id,
      bid_amount: bidAmount,
      bidder_token: user.token,
    };
    if (bidAmount < auctionKoi.base_price) {
      toast.error("Bid amount must be greater than the base price!");
      return;
    }
    if (bidAmount < auctionKoi.current_bid + auctionKoi.bid_step) {
      toast.error(
        "Bid amount must be greater than the current bid and bid step!",
      );
      return;
    }
    if (auctionKoi.is_sold) {
      toast.info("Sold price: " + auctionKoi.current_bid);
      toast.info("Auction is already ended!\n Please reload the page.");
      return;
    }

    placeBid(bidRequest);
    setBidAmount(auctionKoi.current_bid + auctionKoi.bid_step);
  };

  const isAuctionEnded = () => {
    if (!auction) return false;
    //time and date of auction checked later
    return auction.status !== "ACTIVE";
  };

  if (!koi || !auctionKoi || !auction) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="ml-10 mt-6">
        <NavigateButton
          to={`/auctions/${auctionId}`}
          icon={<FontAwesomeIcon icon={faArrowLeft} />}
          text="Back to Auction"
          className="rounded bg-gray-200 px-5 py-3 text-lg text-black transition hover:bg-gray-200"
        />
      </div>
      <div className="m-5 flex flex-col gap-6 p-4 sm:flex-col md:flex-row">
        {/* Koi Image and Media Gallery */}
        <div className="w-full md:w-128">
          <div className="relative h-96 w-full rounded-xl bg-[#4086c7] sm:h-128 md:h-144 lg:h-192">
            {selectedMedia ? (
              selectedMedia.includes("youtube") ? (
                <iframe
                  className="absolute inset-0 h-full w-full rounded-xl"
                  src={selectedMedia}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <img
                  className="absolute inset-0 h-full w-full rounded-xl object-contain shadow-md transition duration-300 hover:shadow-2xl hover:ring-4 hover:ring-blue-400"
                  src={selectedMedia}
                  alt={koi.name}
                />
              )
            ) : (
              <img
                className="absolute inset-0 h-full w-full rounded-xl object-contain shadow-md transition duration-300 hover:shadow-2xl hover:ring-4 hover:ring-blue-400"
                src={koi.thumbnail}
                alt={koi.name}
              />
            )}
            {auctionKoi.is_sold && (
              <div className="absolute -left-4 -top-4 z-10">
                <img
                  src={Sold}
                  alt="Sold"
                  className="h-[10rem] w-[10rem] transform rotate-[-20deg]"
                />
              </div>
            )}
          </div>

          {/* Media Gallery */}
          <div className="mt-4 flex space-x-2 overflow-x-auto">
            <img
              src={koi.thumbnail}
              alt="Main"
              className="h-20 w-20 cursor-pointer rounded-md object-cover"
              onClick={() => setSelectedMedia(koi.thumbnail)}
            />
            {/* {koi.additional_images?.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Additional ${index + 1}`}
                className="h-20 w-20 cursor-pointer rounded-md object-cover"
                onClick={() => setSelectedMedia(img)}
              />
            ))} */}
            <div
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md bg-gray-200"
              onClick={() =>
                setSelectedMedia("https://www.youtube.com/embed/your-video-id")
              }
            ></div>
          </div>
        </div>

        {/* Koi Info and Bidding */}
        <div className="koi-info w-full space-y-4 rounded-2xl bg-gray-200 p-4 text-lg">
          <div className="mb-4 items-center rounded-2xl">
            <div className="grid w-full grid-cols-1 xl:grid-cols-2">
              <h2 className="col-span-1 m-4 text-4xl font-bold xl:col-span-2">
                {koi.name}
              </h2>
              <KoiDetailItem
                icon={faVenusMars}
                label="Sex"
                value={koi.sex}
                bgColor="bg-gray-300"
              />
              <KoiDetailItem
                icon={faRuler}
                label="Length"
                value={koi.length}
                bgColor="bg-gray-300"
              />
              <KoiDetailItem
                icon={faCalendarDays}
                label="Age"
                value={koi.age}
                bgColor="bg-gray-300"
              />
              <KoiDetailItem
                icon={faFish}
                label="Category ID"
                value={koi.category_id}
                bgColor="bg-gray-300"
              />
              <KoiDetailItem
                icon={faDollarSign}
                label="Base Price"
                value={auctionKoi.base_price}
                bgColor="bg-blue-200"
              />
              <KoiDetailItem
                icon={faGavel}
                label="Current Bid"
                value={auctionKoi.current_bid}
                bgColor="bg-green-200"
              />
              <KoiDetailItem
                icon={faHandHoldingHeart}
                label="Bid Method"
                value={auctionKoi.bid_method}
                bgColor="bg-blue-200"
              />
            </div>
          </div>

          {!isAuctionEnded() && !auctionKoi.is_sold ? (
            <div className="mb-4 rounded-2xl bg-gray-300 p-4">
              <h3 className="mb-2 text-xl font-semibold">Place Your Bid</h3>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="mr-2 w-full rounded border p-2"
                placeholder="Enter bid amount"
              />
              <button
                onClick={handlePlaceBid}
                className="mt-2 w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Place Bid
              </button>
            </div>
          ) : (
            <div className="mb-4 rounded-2xl bg-gray-300 p-4">
              <h3 className="mb-2 text-xl font-semibold">Auction Ended</h3>
              <p>This koi has been sold for {auctionKoi.current_bid}</p>
            </div>
          )}
          <h3 className="mb-2 text-xl font-semibold">Bid History</h3>
          <div className="rounded-2xl bg-gray-300 p-4 max-h-[50rem] overflow-auto">
            <div className="max-h-full overflow-auto">
              <BiddingHistory
                auctionKoiId={auctionKoi.id}
                latestBid={latestBid}
              />
            </div>
          </div>
        </div>
      </div>
      {!isAuctionEnded() && (
        <div
          className={`text-sm ${isConnected ? "text-green-500" : "text-red-500"}`}
        >
          {isConnected
            ? "Connected to live updates"
            : "Not connected to live updates"}
        </div>
      )}
    </div>
  );
};

export default KoiBidding;
