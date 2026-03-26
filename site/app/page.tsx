import Hero from "../components/Hero";
import GettingStarted from "../components/GettingStarted";
import LiveExchange from "../components/LiveExchange";
import DepthModes from "../components/DepthModes";
import Themes from "../components/Themes";
import EdgeCases from "../components/EdgeCases";
import DataSafety from "../components/DataSafety";
import PropsTable from "../components/PropsTable";
import DesignRationale from "../components/DesignRationale";
import Footer from "../components/Footer";

export default function Page() {
  return (
    <main>
      <Hero />
      <GettingStarted />
      <LiveExchange />
      <DepthModes />
      <Themes />
      <EdgeCases />
      <DataSafety />
      <PropsTable />
      <DesignRationale />
      <Footer />
    </main>
  );
}
