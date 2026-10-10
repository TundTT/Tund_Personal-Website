// MuJoCo's qpos is a view into its entire WASM heap. Structured-cloning that
// typed view would copy the whole heap, not just the few pose coordinates.
// The scorecard is delivered separately once, on completion.
export function previewSnapshot(snapshot){
  return {...snapshot,result:null,latest:snapshot.latest?{
    ...snapshot.latest,pose:snapshot.latest.pose?Array.from(snapshot.latest.pose):undefined,
  }:null};
}
