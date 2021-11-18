"use strict";

const log  = x => host.diagnostics.debugLog(x + '\n');
const u64  = x => host.memory.readMemoryValues(x, 1, 8)[0];
const exec = x => host.namespace.Debugger.Utility.Control.ExecuteCommand(x);
const hex  = x => x.toString(16);
const ptrsize = _ => host.namespace.Debugger.State.PseudoRegisters.General.ptrsize;

function printUsage()
{
    log("Available commands:");
    log("!callbacks process");
    log("!callbacks thread");
    log("!callbacks image");
    log("!callbacks bugcheck");
    log("!callbacks bugcheckreason");
    log("!callbacks registry");
    log("!callbacks shutdown");
    log("!callbacks shutdownlast");
    log("!callbacks filesystem");
    log("!callbacks powersetting");
    log("!callbacks debugprint");
    log("!callbacks fschange");
    log("!callbacks diskfs");
    log("!callbacks cdromfs");
    log("!callbacks networkfs");
    log("!callbacks tapefs");
    log("!callbacks reinit");
    log("!callbacks reinitboot");
    log("!callbacks nmi");
    log("!callbacks priority");
    log("!callbacks alpcplog");
    log("!callbacks emp");
}

function parseExCallbackList(symb, size)
{
    log(`[+] ${symb}:`);
    let base = host.getModuleSymbolAddress("nt", symb);
    if (base == null)
        return;
    for (let i = 0; i < size; i++)
    {
        let entry = u64(base.add(i * ptrsize()));
        if (entry.compareTo(0) != 0)
        {
            // Strip ref count
            entry = entry.bitwiseAnd(host.parseInt64(-16));
            
            let lock  = u64(entry);
            let fn    = u64(entry.add(ptrsize()));
            let flags = u64(entry.add(ptrsize() * 2));
            log(`\t${exec(`.printf "%y", ${fn}`).First()}`);
        }
    }
}

function parseCallbackList(symb, cb_offset)
{
    log(`[+] ${symb}:`);
    let head = host.getModuleSymbolAddress("nt", symb);
    if (head == null)
        return;
    let block = u64(head);
    while (head.compareTo(block) != 0 && block.compareTo(0) != 0)
    {
        let fn = u64(block.add(cb_offset.multiply(ptrsize())));
        log(`\t${exec(`.printf "%y", ${fn}`).First()}`);
        block = u64(block);
    }
}

function parseObjectList(symb, obj_offset)
{
    log(`[+] ${symb}:`);
    let head = host.getModuleSymbolAddress("nt", symb);
    if (head == null)
        return;
    let entry = u64(head);
    while (head.compareTo(entry) != 0)
    {
        let dev = host.createPointerObject(u64(entry.add(obj_offset.multiply(ptrsize()))), "nt", "_DEVICE_OBJECT*");
        let drv = host.createPointerObject(dev.DriverObject.address, "nt", "_DRIVER_OBJECT*");
        let irp = drv.MajorFunction[0x10].dereference();
        log(`\t${irp}`);
        entry = u64(entry);
    }
}

function enumerateCallbacks(method)
{
    switch(method)
    {
        case "process": parseExCallbackList("PspCreateProcessNotifyRoutine", 64); break;
        case "thread": parseExCallbackList("PspCreateThreadNotifyRoutine", 64); break;
        case "image": parseExCallbackList("PspLoadImageNotifyRoutine", 8); break;
        case "bugcheck": parseCallbackList("KeBugCheckCallbackListHead", 2); break;
        case "bugcheckreason": parseCallbackList("KeBugCheckReasonCallbackListHead", 2); break;
        case "registry": parseCallbackList("CallbackListHead", 5); break;
        case "shutdown": parseObjectList("IopNotifyShutdownQueueHead", 2); break;
        case "shutdownlast": parseObjectList("IopNotifyLastChanceShutdownQueueHead", 2); break;
        case "filesystem": parseCallbackList("SeFileSystemNotifyRoutinesHead", 1); break;
        case "powersetting": parseCallbackList("PopRegisteredPowerSettingCallbacks", 10); break;
        case "debugprint": parseCallbackList("RtlpDebugPrintCallbackList", 2); break;
        case "fschange": parseCallbackList("IopFsNotifyChangeQueueHead", 3); break;
        case "diskfs": log("not implemented"); break;
        case "cdromfs": log("not implemented"); break;
        case "networkfs": log("not implemented"); break;
        case "tapefs": log("not implemented"); break;
        case "reinit": parseCallbackList("IopDriverReinitializeQueueHead", 3); break;
        case "reinitboot": parseCallbackList("IopBootDriverReinitializeQueueHead", 3); break;
        case "nmi": parseCallbackList("KiNmiCallbackListHead", 1); break;
        case "priority": parseExCallbackList("IopUpdatePriorityCallbackRoutine", 8); break;
        case "alpcplog": parseCallbackList("AlpcpLogCallbackListHead", 2); break;
        case "emp": parseCallbackList("EmpCallbackListHead", -3); break;
        default: printUsage(); break;
    }
}

function initializeScript()
{
    return [new host.apiVersionSupport(1, 7),
            new host.functionAlias(enumerateCallbacks, "callbacks")];
}
