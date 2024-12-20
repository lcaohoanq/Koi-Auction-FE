import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "~/utils/currencyUtils";
import { format } from "date-fns";
import LoadingComponent from "../shared/LoadingComponent";
import { BIDDING_MESSAGE } from "~/constants/message";
import { fetchBidHistory } from "~/apis/bidding.apis";
import { Bid } from "~/types/bids.type";

interface BiddingChartProps {
  auctionKoiId: number;
  latestBid: Bid | null;
}

interface ChartData {
  time: string;
  amount: number;
  bidder: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-semibold">{`Time: ${label}`}</p>
        <p className="text-blue-600">{`Bidder: ${payload[0].payload.bidder}`}</p>
        <p className="text-green-600">{`Amount: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const BiddingChart: React.FC<BiddingChartProps> = ({
  auctionKoiId,
  latestBid,
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBiddingHistory = async () => {
      try {
        const history = await fetchBidHistory(auctionKoiId);
        if (history) {
          const formattedData = history
            .map((bid: Bid) => ({
              time: format(new Date(bid.bid_time), "HH:mm:ss"),
              amount: bid.bid_amount,
              bidder: bid.bidder_name,
            }))
            .reverse();
          setChartData(formattedData);
        }
      } catch (error) {
        console.error(BIDDING_MESSAGE.ERROR_LOADING_BIDDING_HISTORY, error);
      } finally {
        setLoading(false);
      }
    };

    loadBiddingHistory();
  }, [auctionKoiId, latestBid]);

  if (loading) return <LoadingComponent />;

  const maxBid = Math.max(...chartData.map((data) => data.amount));
  const yAxisMax = maxBid * 1.2;

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
            fontSize={12}
          />
          <YAxis
            orientation="right"
            yAxisId="right"
            domain={[0, yAxisMax]}
            tickFormatter={(value) => formatCurrency(value)}
            fontSize={12}
            allowDataOverflow={false}
            ticks={Array.from({ length: 6 }, (_, i) =>
              Math.round((yAxisMax * i) / 5),
            )}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            yAxisId="right"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BiddingChart;
