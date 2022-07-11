import fs from "fs";

import { DataPoint, runAgent } from "@gads-citron/agent-core";
import PromisePool from "@supercharge/promise-pool";
import * as yup from "yup";

import { ClientFtp } from "./ClientFtp";
import { dateFromFilename, fileParser } from "./file-parser";
import { getState, setState } from "./state.service";

runAgent(async function ({ getConfig, logDebug, processDataPoint }) {
  try {
    const config = getConfig("esset");
    const validConfig = essetConfig.validateSync(config);
    const defaultDate = new Date(
      +new Date() -
        validConfig.dataFetching.dontProcessDataOlderThan * 60 * 1_000
    );
    const state = getState(defaultDate);
    logDebug("Get State : ");
    logDebug(state);
    const clientFtp = new ClientFtp(validConfig.ftp);
    const listing = await clientFtp.list();
    clientFtp.close();
    const filesToProcess = listing.filter(
      (l) =>
        new RegExp("Export_Horaire_CITRON_save").exec(l.name) &&
        dateFromFilename(l.name).getTime() > new Date(state.timestamp).getTime()
    );
    logDebug(`Full list : ${listing.length}`);
    logDebug(`Filtered : ${filesToProcess.length}`);
    let lastFileSync = "";
    await PromisePool.withConcurrency(
      validConfig.dataFetching.filesToProcessInParallel
    )
      .for(filesToProcess)
      .handleError(propagateError)
      .process(async (f) => {
        const tmpClient = new ClientFtp(validConfig.ftp);
        logDebug(`Processing file: ${f.name}`);
        if (f.size === 0) {
          logDebug(`Skipping file ${f.name} because it is Empty.`);
          lastFileSync = f.name;
          setState({
            filename: lastFileSync,
            timestamp: dateFromFilename(lastFileSync).getTime(),
          });
          return;
        }
        logDebug(`Download file: ${f.name}`);
        const fileContent = await tmpClient.getFileToProcess(f.name, logDebug);
        logDebug(`Parsing File ${f.name}`);
        const parsedCsv = fileParser(fileContent, validConfig.fileParser);
        logDebug(`File contains : ${parsedCsv.length} dataPoints`);
        let counter = 0;
        for (const row of parsedCsv) {
          counter++;
          const transformedPoint: DataPoint = {
            timestamp: Date.parse(row[0]) / 1000,
            deviceId: row[1],
            value: row[2],
          };
          logDebug(
            `Processing ${transformedPoint.deviceId} - ${counter} / ${parsedCsv.length}`
          );

          await processDataPoint(transformedPoint, row);
        }
        lastFileSync = f.name;
        setState({
          filename: lastFileSync,
          timestamp: dateFromFilename(lastFileSync).getTime(),
        });
        await tmpClient.close();
      });
    await clientFtp.close();
    logDebug("Task Finished Successfully");
  } catch (e) {
    propagateError(e);
  }
});

const essetConfig = yup
  .object({
    ftp: yup
      .object({
        host: yup.string().defined(),
        port: yup.number().optional(),
        username: yup.string().defined(),
        password: yup.string().defined(),
      })
      .defined(),
    dataFetching: yup
      .object({
        filesToProcessInParallel: yup.number().min(1).defined(),
        dontProcessDataOlderThan: yup.number().min(0).defined(),
        fileNameDatePattern: yup.string().required(),
      })
      .defined(),
    fileParser: yup.object({
      delimiter: yup.string().defined(),
    }),
  })
  .defined();

async function propagateError(error: Error) {
  throw error;
}
