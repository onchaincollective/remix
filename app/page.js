import Home from "@/components/home";

export default function Main() {
  return (
    <main className="occ-home">
      <Home />
      <div className="flex align-center flex-col max-w-2xl mx-auto text-center mt-8 p-4 sticky bottom-8">
        <div className="text-md ">
          <a href="https://occ.xyz/" target="_blank" className="hover:underline">
            occ
          </a>
          {" "}&bull;{" "}
          <a href="https://occ.xyz/flowers" target="_blank" className="hover:underline">
            flowers
          </a>
          {" "}&bull;{" "}
          <a href="https://twitter.com/OnChainCo" target="_blank" className="hover:underline">
            twitter
          </a>
          {" "}&bull;{" "}
          <a href="https://discord.com/invite/BUCup66VKc" target="_blank" className="hover:underline">
            discord
          </a>
        </div>
      </div>
    </main>
  );
}
