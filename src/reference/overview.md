---
author: 李兴权
audition: iEDA 课题组
history:
  - version: 0.10
    date: 2022-05-25
    author: 李兴权
    description: 形成设计说明书初稿
---

# 总体介绍

## 简介

对于现代超大规模数字集成电路（VLSI）设计，电子设计自动化（EDA）是至关重要的工具。“后面继续补充”

### 1 芯片设计基础

#### 1.1 芯片设计层次

芯片设计从层次化上，总体上可以分为以下几个层次：

* 系统级：芯片系统架构的设计，具备独立完整功能的IP模块

  ```
  Port* compute_optimal_route_for_packet (Packet_t *packet, Channel_t *channel){ 
      static Queue_t *packet_queue; packet_queue = add_packet(packet_queue, packet); ......
  }
  ```
* 寄存器级：借助寄存器将功能实现出来，形成RTL代码

  <img src="https://images.gitee.com/uploads/images/2022/0525/180936_4c445e28_8273072.png" alt="6" style="zoom:25%;" />
* 门级：经过综合工具，将RTL代码转化为电路，再将电路映射为由GTech或者标准单元库形成的门级网表；

  <img src="https://images.gitee.com/uploads/images/2022/0525/180919_5542498c_8273072.png" alt="6" style="zoom:25%;" />
* 晶体管级：标准单元库中的每个单元均已提前设计好，其中关键组建是晶体管，也是最原子的级别；

  <img src="https://images.gitee.com/uploads/images/2022/0525/181001_adc00885_8273072.png" alt="6" style="zoom:25%;" />
* 版图级：门级网表经过物理化之后，会形成一个版图GDS，属于芯片制造的图纸；

  <img src="https://images.gitee.com/uploads/images/2022/0525/181304_6fe49636_8273072.png" alt="6" style="zoom:25%;" />
* 掩膜级：芯片生产厂商会根据版图分层设计掩膜，用于指导光刻机进行曝光，先进工艺甚至需要多次曝光；

  <img src="https://images.gitee.com/uploads/images/2022/0525/181100_d80871ac_8273072.png" alt="6" style="zoom:25%;" />

#### 1.2 设计自动化内容

整个芯片的设计过程大体上可以总结为如下的抽象过程，

* 规格制定：根据产品需求，制定相应的规格
* 架构设计：根据规格需求，设计芯片架构，系统功能模块划分，定义BUS结构，系统模型，制造封装和板卡要求，输出设计文档；
* 功能实现和验证：按照每个功能模块，实现相应的RTL代码并进行功能仿真验证，期间主要借助Debug工具和波形仿真工具，输出RTL级的Verilog代码。如有需要，每个IP功能模块需进行SOC集成，功能验证。对于验证，可以借助FPGA或者硬仿来完成；
* 逻辑综合：对RTL代码进行逻辑编译形成状态机或真值表，接着进行逻辑优化设计形成GTech电路，然后通过工艺库映射得到网表，并进行电路级仿真和形式化验证，输出Netlist级的Verilog代码。综合后进行DFT，插入一些测试模块；
* 单元库设计：从Foundary获得工艺库基本会含有IO，Memory和部分IP，以及PDK和单元库。但是对于单元库可以进一步优化设计，首先设计单元模型，进行单元电路版图设计，对单元进行参数提取，进行物理验证；
* 物理设计：对于综合获得的网表，需要设计Floorplan，布局，时钟树综合，布线，ECO等步骤，最后得到GDS版图文件。当然，为了实现预期的PPA指标和满足设计规则，物理设计往往需要迭代多次。另外，物理设计的每个步骤也需要进行形式化验证以确认功能的正确性；
* 签核分析：在逻辑综合和物理设计过程中，需对电路和版图进行参数提取，时序，功耗，IR drop，电源和信号完整性等分析，确保获得的电路和版图是满足设计规格约束的；
* 物理验证：得到GDS版图之后，除了需要进行签核分析，还需进行物理结构上的验证，主要包括：设计规则检查(DRC)，电学规则检查(ERC)，版图和原理图比较(LVS)等。之后还需进行一次最后的仿真，以确保整个版图功能的正确性；
* 版图处理：在完成物理验证之后，芯片设计环节基本完成，接下来需要将版图交给Foundary来开掩膜(Mask)。需要对GDS版图进一步优化，进行OPC和RET，目的是为了增强分别率，减少生产变形错误，接着用于制作生成Mask；
* 制造封装测试：主要有Foudary和封测厂完成，回片；
* PCB：在完成上述步骤后，基本可以得到一颗芯片，可以将其集成到需要的PCB进行实践验证和使用，PCB级板卡也设计到如何布局布线等问题；

<img src="https://images.gitee.com/uploads/images/2022/0526/104146_98f059c1_8273072.png" alt="6" style="zoom:25%;" />

图1.1.1 主要EDA工具步骤

<img src="https://images.gitee.com/uploads/images/2022/0530/145123_9b414b6d_8273072.png" alt="6" style="zoom:30%;" />

图1.1.2 主要EDA工具步骤

整个芯片设计过程中，主要产生的EDA工具涵盖的分类和内容可以总结为以下的五大方面，

* **设计综合：** 设计环节主要包括，高层次综合，逻辑综合，物理设计，封装设计，PCB设计
* **仿真模拟：** 仿真环节主要包括：TCAD，晶体管仿真，逻辑仿真，硬件仿真，场求解器
* **验证测试：** 验证测试环节主要包括：功能验证，形式化验证，等效性检查，ATPG，BIST，物理验证
* **分析检查：** 分析环节主要包括：跨时钟域，寄生提取，（静态）时序分析，功耗分析，温度分析，电压降分析，信号/电源完整性分析
* **掩膜准备：** 掩膜环节主要包括：版图分解，OPC，RET，掩膜生成

<img src="https://images.gitee.com/uploads/images/2022/0525/175128_fb471b46_8273072.png" alt="6" style="zoom:35%;" />

图1.1.3 主要EDA工具步骤

iEDA 课题组主要的研发重点关注在芯片逻辑综合，物理设计，签核分析和物理验证环节，如下图绿色部分所示：

<img src="https://images.gitee.com/uploads/images/2022/0530/150057_1b7674b3_8273072.png" alt="6" style="zoom:30%;" />

图1.1.4 主要EDA工具步骤

### 2 设计需求和目标

- 设计全流程：支持110nm/55nm/28nm芯片RTL到GDS，并且进行签核分析和物理验证

  - WLM：线负载模型，根据net的fanout评估逻辑综合后netlist的总线长，依赖于.lib的WLM信息
  - HPWL：半周长线长，用组成net的pins所围成的外接矩形的半周长来近似该net的走线长度
  - Clique、Star、Bound2Bound：布局二次解析法中常用的线长近似模型
  - 斯坦纳树：对net构建斯坦那点，并以斯坦纳树长度作为该net的走线长度，主要有HVTree/FLUTE
  - 驱动到负载：计算net的driver到指定sink pin的L-shaped长度
  - 布线：评估全局布线和详细布线阶段的总线长
- 开源开放：

  - 布局：评估布局阶段的时序，同时支持获取指定pin的时序信息，依赖于iSTA
  - 布线：评估布线阶段的时序，依赖于iSTA
- 软件解耦：

  - 单元密度：将core区域划分为若干bin，计算每个bin内instance的密度
  - 引脚密度：将core区域划分为若干bin，计算每个bin内pin的个数
  - BBox密度：将core区域划分为若干bin，计算每个bin内net的密度
  - GR拥塞：将die区域划分为若干tile，计算每个tile的overflow值，依赖于iRT
- 文档齐全：
- 性能优化：
- 智能化
- 社区生态：

### 3 专有名词

| **名词** | **解释**                                                                       |
| -------------- | ------------------------------------------------------------------------------------ |
| HPWL           | Half Perimeter Wire Length，用组成net的pins所围成的外接矩形的半周长来近似net长度     |
| WLM            | Wire Load Model，在.lib文件中记录的net的fanout与线长之间的映射关系                   |
| Clique         | 团模型 ，组成net的pins之间两两相连                                                   |
| Star           | 星模型， 在组成net的pins之间计算重心，将该重心作为虚拟pin，所有pins连接于该虚拟pin   |
| B2B            | 边界模型，只计算每个pin到边界pin的距离，用此距离的和来近似net线长                    |
| HTree          | Horizontal Tree，计算pins水平方向重心，以此构建树干，其余pin连接到树干上形成斯坦那点 |
| VTree          | Vertical Tree，计算pins竖直方向重心，以此构建树干，其余pin连接到树干上形成斯坦那点   |
| FLUTE          | 一种基于查找表的构建斯坦纳树方法                                                     |
| BBox           | Bounding Box，组成net的pins所围成的外接矩形                                          |
| RUDY           | Rectangular Uniform Wire Density，评估BBox拥塞的一类方法                             |
|                |                                                                                      |

### 4 参考文档

> 格式为    方法关键词：对应方法的论文标题

- 线长评估器
  - B2B：Kraftwerk2—A Fast Force-Directed Quadratic Placement Approach Using an Accurate Net Model
- 时序评估器
  - FLUTE：FLUTE: Fast lookup table based wirelength estimation technique
- 拥塞评估器
  - RUDY：Fast and Accurate Routing Demand Estimation for Efficient Routability-driven Placement
  - PinRUDY：Global Placement with Deep Learning-Enabled Explicit Routability Optimization
  - RUDY-dev：Routability-Driven Analytical Placement by Net Overlapping Removal for Large-Scale Mixed-Size Designs




    ```cpp

    ```
