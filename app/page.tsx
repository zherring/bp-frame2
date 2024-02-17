import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import { DEBUG_HUB_OPTIONS } from "./debug/constants";

type State = {
  current: number;
};


const currentDate = new Date();
const targetDate = new Date("2023-08-10");
const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds

const daysSinceTargetDate = Math.round(Math.abs((currentDate.getTime() - targetDate.getTime()) / oneDay));
const osURL = "https://opensea.io/assets/base/0xba5e05cb26b78eda3a2f8e3b3814726305dcac83/";

const initialState = { current: daysSinceTargetDate };


const reducer: FrameReducer<State> = (state, action) => {
  let newCurrent = state.current;
  if (action.postBody?.untrustedData.buttonIndex === 1) {
    // Decrement current by 1, ensuring it doesn't go below 0
    newCurrent = Math.max(1, state.current - 1);
  } else if (action.postBody?.untrustedData.buttonIndex === 2) {
    // Increment current by 1, ensuring it doesn't exceed max days
    newCurrent = Math.min(daysSinceTargetDate, state.current + 1);
  }

return {
  current: newCurrent,
  };
};

// This is a react server component only
export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);
  

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    ...DEBUG_HUB_OPTIONS,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT

  console.log("info: state is:", state);

  if (frameMessage) {
    const {
      isValid,
      buttonIndex,
      inputText,
      castId,
      requesterFid,
      casterFollowsRequester,
      requesterFollowsCaster,
      likedCast,
      recastedCast,
      requesterVerifiedAddresses,
      requesterUserData,
    } = frameMessage;

    console.log("info: frameMessage is:", frameMessage);
  }

  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

  // then, when done, return next frame
  return (
    <div className="p-4">
      frames.js starter kit for BP Paint. The Template Frame is on this page, it&apos;s in
      the html meta tags (inspect source).{" "}
      <Link href={`/debug?url=${baseUrl}`} className="underline">
        Debug
      </Link>
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >

      <FrameImage>
          <div tw="flex w-full h-full bg-black text-white justify-center items-center">
            <img src={`https://basepaint.xyz/api/art/image?day=${state.current}`} height={600} width={600} />
          </div>
      </FrameImage>
        
        <FrameButton action="post" {...{ onClick: dispatch as any }}>
          Prev
        </FrameButton>

        {state.current !== daysSinceTargetDate ? (
          <FrameButton action="post" {...{ onClick: dispatch as any }}>
            Next
          </FrameButton>
        ) : null} 

      {state.current === daysSinceTargetDate ? ( 
          <FrameButton action="link" target="https://basepaint.xyz/mint">
            Mint
          </FrameButton>
        ) : (
          <FrameButton action="link" target={`${osURL}${state.current}`}>
            Buy on OS
          </FrameButton>
        )} 
      </FrameContainer>
    </div>
  );
}
