"use strict";

class Section
{
    // //0x28 bytes (sizeof)
    // struct _IMAGE_SECTION_HEADER
    // {
    //     UCHAR Name[8];                                                          //0x0
    //     union
    //     {
    //         ULONG PhysicalAddress;                                              //0x8
    //         ULONG VirtualSize;                                                  //0x8
    //     } Misc;                                                                 //0x8
    //     ULONG VirtualAddress;                                                   //0xc
    //     ULONG SizeOfRawData;                                                    //0x10
    //     ULONG PointerToRawData;                                                 //0x14
    //     ULONG PointerToRelocations;                                             //0x18
    //     ULONG PointerToLinenumbers;                                             //0x1c
    //     USHORT NumberOfRelocations;                                             //0x20
    //     USHORT NumberOfLinenumbers;                                             //0x22
    //     ULONG Characteristics;                                                  //0x24
    // };
    constructor(address)
    {
        this.__address              = address;
        this.__Name                 = host.memory.readMemoryValues(address, 8, 1);
        this.__VirtualSize          = host.memory.readMemoryValues(address.add(0x08), 1, 4)[0];
        this.__VirtualAddress       = host.memory.readMemoryValues(address.add(0x0c), 1, 4)[0];
        this.__SizeOfRawData        = host.memory.readMemoryValues(address.add(0x10), 1, 4)[0];
        this.__PointerToRawData     = host.memory.readMemoryValues(address.add(0x14), 1, 4)[0];
        this.__PointerToRelocations = host.memory.readMemoryValues(address.add(0x18), 1, 4)[0];
        this.__PointerToLinenumbers = host.memory.readMemoryValues(address.add(0x1c), 1, 4)[0];
        this.__NumberOfRelocations  = host.memory.readMemoryValues(address.add(0x20), 1, 2)[0];
        this.__NumberOfLinenumbers  = host.memory.readMemoryValues(address.add(0x22), 1, 2)[0];
        this.__Characteristics      = host.memory.readMemoryValues(address.add(0x24), 1, 4)[0];
    }


    static binaryToString(array)
    {
        let result = "";
        for (let i = 0; i < array.length; i++) 
        {
            if (array[i] === 0)
                break;
            result += String.fromCharCode(array[i]);
        }
        return result;
    }
    //    
    // Getters
    //
    get Address()
    {
        return this.__address;
    }

    get Name()
    {
        return Section.binaryToString(this.__Name);
    }

    get VirtualSize()
    {
        return this.__VirtualSize;
    }

    get VirtualAddress()
    {
        return this.__VirtualAddress;
    }

    get SizeOfRawData()
    {
        return this.__SizeOfRawData;
    }

    get PointerToRawData()
    {
        return this.__PointerToRawData;
    }

    get PointerToRelocations()
    {
        return this.__PointerToRelocations;
    }

    get PointerToLinenumbers()
    {
        return this.__PointerToLinenumbers;
    }

    get NumberOfRelocations()
    {
        return this.__NumberOfRelocations;
    }

    get NumberOfLinenumbers()
    {
        return this.__NumberOfLinenumbers;
    }

    get Characteristics()
    {
        return this.__Characteristics;
    }
    //
    // Setters
    //
    get Name()
    {
        return Section.binaryToString(this.__Name);
    }

    set VirtualSize(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x08), 1, [value], 4);
        this.__VirtualSize = value;
    }

    set VirtualAddress(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0xc), 1, [value], 4);
        this.__VirtualAddress = value;
    }

    set SizeOfRawData(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x10), 1, [value], 4);
        this.__SizeOfRawData = value;
    }

    set PointerToRawData(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x14), 1, [value], 4);
        this.__PointerToRawData = value;
    }

    set PointerToRelocations(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x18), 1, [value], 4);
        this.__PointerToRelocations = value;
    }

    set PointerToLinenumbers(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x1c), 1, [value], 4);
        this.__PointerToLinenumbers = value;
    }

    set NumberOfRelocations(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x20), 1, [value], 2);
        this.__NumberOfRelocations = value;
    }

    set NumberOfLinenumbers(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x22), 1, [value], 2);
        this.__NumberOfLinenumbers = value;
    }

    set Characteristics(value)
    {
        host.memory.writeMemoryValues(this.__address.add(0x24), 1, [value], 4);
        this.__Characteristics = value;
    }
}

class SectionViewer
{
    *collectSections()
    {
        const ptrsize = host.namespace.Debugger.State.PseudoRegisters.General.ptrsize;
        const pe = host.createPointerObject(this.BaseAddress, "ntdll", "_IMAGE_DOS_HEADER*");
        const nt = host.createPointerObject(this.BaseAddress + pe.e_lfanew, "ntdll", ptrsize === 8 ? "_IMAGE_NT_HEADERS64*" : "_IMAGE_NT_HEADERS32*");
        const headerBase = nt.address + 0x14 + 4 + nt.FileHeader.SizeOfOptionalHeader;
        for (let i = 0; i < nt.FileHeader.NumberOfSections; i++)
        {
            yield new Section(headerBase.add(i.multiply(0x28)));
        }
    }

    get Sections()
    {

        return this.collectSections();
    }
}

function initializeScript()
{
    return [new host.namedModelParent(SectionViewer, "Debugger.Models.Module")];
}
