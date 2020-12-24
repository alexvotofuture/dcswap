const path = require("path");
const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
const { Engine, Task, utils, vm } = require("yajsapi");
const { program } = require("commander");

dayjs.extend(duration);

const { asyncWith, logUtils, range } = utils;

async function main(subnetTag) {
  const _package = await vm.repo(
    "a7c832bc1f6b5f51560d12023e19de6de8c7411daf286477cb0acb8a",
    0.5,
    2.0
  );

  async function* worker(ctx, tasks) {
    ctx.send_file(
      path.join(__dirname, "./facein/image1.jpg"),
      "/tmp/faceswap/image1.jpg"
    );
    ctx.send_file(
      path.join(__dirname, "./facein/image2.jpg"),
      "/tmp/faceswap/image2.jpg"
    );
    for await (let task of tasks) {
      let frame = task.data();
      ctx.run("faceswap.py");
      ctx.download_file(
        `/tmp/output.jpg`,
        path.join(__dirname, `./output.jpg`)
      );
      yield ctx.commit();
      task.accept_task('ouput.jpg');
    }
    ctx.download_file(
      `/tmp/faceswap/output.jpg`,
      path.join(__dirname, `./output.jpg`)
    );
    ctx.log("FaceSwap complete!");
    return;
  }

  const frames = [0];
  const timeout = dayjs.duration({ minutes: 15 }).asMilliseconds();

  await asyncWith(
    await new Engine(
      _package,
      6,
      timeout, //5 min to 30 min
      "10.0",
      undefined,
      subnetTag//,
//      logUtils.logSummary()
    ),
    async (engine) => {
      for await (let task of engine.map(
        worker,
        frames.map((frame) => new Task(frame))
      )) {
      }
    }
  );
  return;
}

program
  .option('--subnet-tag <subnet>', 'set subnet name', 'community.3')
  .option('-d, --debug', 'output extra debugging');
program.parse(process.argv);
if (program.debug) {
  utils.changeLogLevel("debug");
}
console.log(`Using subnet: ${program.subnetTag}`);
main(program.subnetTag);
