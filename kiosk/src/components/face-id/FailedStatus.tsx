interface IFailedStatus {
  error?: [string, string] | null;
  isSpoof?: boolean | null;
}

const FailedStatus = ({ error, isSpoof }: IFailedStatus) => {
  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center gap-2">
        <h3 className="text-4xl text-uRed font-semibold mt-4">{error[0]}</h3>
        <p className="text-base text-textBody">{error[1]}</p>
      </div>
    );
  }

  if (isSpoof) {
    return (
      <div className="flex-1 flex flex-col justify-center gap-2">
        <h3 className="text-4xl text-uRed font-semibold mt-4">FACE NOT REAL</h3>
        <p className="text-sm text-textBody" style={{ lineHeight: 1.4 }}>
          • Our system detected a potential spoofing attempt. Please avoid using
          photos, videos, or masks.
        </p>
        <p className="text-sm text-textBody" style={{ lineHeight: 1.4 }}>
          • Make sure your actual face is clearly visible and well-lit in front
          of the camera.
        </p>
        <p className="text-sm text-textBody" style={{ lineHeight: 1.4 }}>
          • If you believe this is a mistake, please adjust your position or
          lighting and try again.
        </p>
      </div>
    );
  }

  // Not recognized state
  return (
    <div className="flex-1 flex flex-col justify-center gap-2">
      <h3 className="text-4xl text-uRed font-semibold mt-4">NOT RECOGNIZE!</h3>
      <p className="text-sm text-textBody" style={{ lineHeight: 1.3 }}>
        • Remove any accessories such as hats, glasses, or masks that may block
        your facial features.
      </p>
      <p className="text-sm text-textBody" style={{ lineHeight: 1.3 }}>
        • Keep a neutral face while capturing your photo for the accurate
        results.
      </p>
      <p className="text-sm text-textBody" style={{ lineHeight: 1.3 }}>
        • Ensure that your entire facial feature is clearly visible and well-lit
        before trying again.
      </p>
      <p className="text-sm text-textBody" style={{ lineHeight: 1.3 }}>
        • If you believe this is an error, please contact management for
        assistance. We apologize for the inconvenience.
      </p>
    </div>
  );
};

export default FailedStatus;
